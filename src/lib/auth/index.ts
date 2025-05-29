import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { executeQuery, getOne, executeSingle } from '../mysql/connection';
import crypto from 'crypto';

export type UserRole = 'admin' | 'manager' | 'sales' | 'inventory' | 'customer';

export interface User {
  id: string;
  email: string;
  email_verified: boolean;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: UserRole | null;
}

export interface AuthSession {
  user: User;
  profile: UserProfile;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const COOKIE_NAME = 'auth-token';

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generate JWT token
export function generateToken(userId: string): string {
  return jwt.sign(
    { userId, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Verify JWT token
export function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

// Set auth cookie
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });
}

// Clear auth cookie
export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// Get current session
export async function getSession(): Promise<AuthSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return null;
    }

    // Get user from database
    const user = await getOne<User>(
      'SELECT id, email, email_verified, created_at FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!user) {
      return null;
    }

    // Get user profile
    const profile = await getOne<any>(
      `SELECT p.id, p.first_name, p.last_name, p.email, r.name as role_name
       FROM profiles p
       LEFT JOIN roles r ON p.role_id = r.id
       WHERE p.id = ?`,
      [user.id]
    );

    if (!profile) {
      return null;
    }

    return {
      user,
      profile: {
        id: profile.id,
        email: profile.email || user.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        role: profile.role_name as UserRole || null,
      },
    };
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

// Get user profile
export async function getUserProfile(): Promise<UserProfile | null> {
  const session = await getSession();
  return session?.profile || null;
}

// Sign in user
export async function signIn(email: string, password: string): Promise<AuthSession> {
  console.log('🔐 Sign in attempt for:', email);

  // Get user by email
  const user = await getOne<User & { password_hash: string }>(
    'SELECT id, email, email_verified, password_hash, created_at FROM users WHERE email = ?',
    [email]
  );

  console.log('👤 User found:', user ? 'Yes' : 'No');

  if (!user) {
    console.log('❌ User not found');
    throw new Error('Invalid email or password');
  }

  console.log('🔑 Verifying password...');
  console.log('Password provided:', password);
  console.log('Stored hash:', user.password_hash);

  // Verify password
  const isValidPassword = await verifyPassword(password, user.password_hash);
  console.log('✅ Password valid:', isValidPassword);

  if (!isValidPassword) {
    console.log('❌ Password verification failed');
    throw new Error('Invalid email or password');
  }

  // Generate token and set cookie
  const token = generateToken(user.id);
  await setAuthCookie(token);

  // Get profile
  const profile = await getOne<any>(
    `SELECT p.id, p.first_name, p.last_name, p.email, r.name as role_name
     FROM profiles p
     LEFT JOIN roles r ON p.role_id = r.id
     WHERE p.id = ?`,
    [user.id]
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      email_verified: user.email_verified,
      created_at: user.created_at,
    },
    profile: {
      id: profile?.id || user.id,
      email: profile?.email || user.email,
      first_name: profile?.first_name || null,
      last_name: profile?.last_name || null,
      role: profile?.role_name as UserRole || null,
    },
  };
}

// Sign up user
export async function signUp(
  email: string,
  password: string,
  firstName: string,
  lastName: string
): Promise<AuthSession> {
  // Check if user already exists
  const existingUser = await getOne(
    'SELECT id FROM users WHERE email = ?',
    [email]
  );

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Get customer role ID
  const customerRole = await getOne<{ id: string }>(
    'SELECT id FROM roles WHERE name = ?',
    ['customer']
  );

  if (!customerRole) {
    throw new Error('Customer role not found');
  }

  try {
    // Create user
    const userResult = await executeSingle(
      'INSERT INTO users (id, email, password_hash, email_verified) VALUES (UUID(), ?, ?, FALSE)',
      [email, passwordHash]
    );

    // Get the created user
    const user = await getOne<User>(
      'SELECT id, email, email_verified, created_at FROM users WHERE email = ?',
      [email]
    );

    if (!user) {
      throw new Error('Failed to create user');
    }

    // Create profile
    await executeSingle(
      'INSERT INTO profiles (id, first_name, last_name, email, role_id) VALUES (?, ?, ?, ?, ?)',
      [user.id, firstName, lastName, email, customerRole.id]
    );

    // Generate token and set cookie
    const token = generateToken(user.id);
    await setAuthCookie(token);

    return {
      user,
      profile: {
        id: user.id,
        email: user.email,
        first_name: firstName,
        last_name: lastName,
        role: 'customer',
      },
    };
  } catch (error) {
    console.error('Error creating user:', error);
    throw new Error('Failed to create user account');
  }
}

// Sign out user
export async function signOut() {
  await clearAuthCookie();
  redirect('/login');
}

// Require authentication
export async function requireAuth(): Promise<AuthSession> {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return session;
}

// Require specific role
export async function requireRole(allowedRoles: UserRole[]): Promise<AuthSession> {
  const session = await requireAuth();

  if (!session.profile.role || !allowedRoles.includes(session.profile.role)) {
    redirect('/dashboard');
  }

  return session;
}

// Generate password reset token
export async function generateResetToken(email: string): Promise<string | null> {
  // Check if user exists
  const user = await getOne<User>(
    'SELECT id, email FROM users WHERE email = ?',
    [email]
  );

  if (!user) {
    // Don't reveal if user exists or not for security
    return null;
  }

  // Generate a secure random token
  const token = crypto.randomBytes(32).toString('hex');

  // Set expiration to 1 hour from now
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  // Store the token in database
  await executeSingle(
    'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
    [user.id, token, expiresAt]
  );

  return token;
}

// Verify password reset token
export async function verifyResetToken(token: string): Promise<string | null> {
  const resetToken = await getOne<{ user_id: string; expires_at: Date; used: boolean }>(
    'SELECT user_id, expires_at, used FROM password_reset_tokens WHERE token = ?',
    [token]
  );

  if (!resetToken) {
    return null;
  }

  if (resetToken.used) {
    return null;
  }

  if (new Date() > new Date(resetToken.expires_at)) {
    return null;
  }

  // Mark token as used
  await executeSingle(
    'UPDATE password_reset_tokens SET used = TRUE WHERE token = ?',
    [token]
  );

  return resetToken.user_id;
}

// Reset password (improved implementation)
export async function resetPassword(email: string): Promise<boolean> {
  const token = await generateResetToken(email);

  if (!token) {
    // Still return true to not reveal if user exists
    console.log('Password reset requested for non-existent email:', email);
    return true;
  }

  // Import email service dynamically to avoid circular dependencies
  const { sendPasswordResetEmail } = await import('@/lib/email');

  // Send password reset email
  const emailSent = await sendPasswordResetEmail(email, token);

  if (!emailSent) {
    console.error('Failed to send password reset email to:', email);
    // Still return true to not reveal if user exists or if email failed
  } else {
    console.log('Password reset email sent successfully to:', email);
  }

  return true;
}

// Update password
export async function updatePassword(userId: string, newPassword: string): Promise<boolean> {
  const passwordHash = await hashPassword(newPassword);

  const result = await executeSingle(
    'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [passwordHash, userId]
  );

  return result.affectedRows > 0;
}
