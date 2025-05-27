import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { executeQuery, getOne, executeSingle } from '../mysql/connection';

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
export function setAuthCookie(token: string) {
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });
}

// Clear auth cookie
export function clearAuthCookie() {
  const cookieStore = cookies();
  cookieStore.delete(COOKIE_NAME);
}

// Get current session
export async function getSession(): Promise<AuthSession | null> {
  try {
    const cookieStore = cookies();
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
  // Get user by email
  const user = await getOne<User & { password_hash: string }>(
    'SELECT id, email, email_verified, password_hash, created_at FROM users WHERE email = ?',
    [email]
  );
  
  if (!user) {
    throw new Error('Invalid email or password');
  }
  
  // Verify password
  const isValidPassword = await verifyPassword(password, user.password_hash);
  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }
  
  // Generate token and set cookie
  const token = generateToken(user.id);
  setAuthCookie(token);
  
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
    setAuthCookie(token);
    
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
  clearAuthCookie();
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

// Reset password (placeholder - would need email service)
export async function resetPassword(email: string): Promise<boolean> {
  // TODO: Implement email-based password reset
  console.log('Password reset requested for:', email);
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
