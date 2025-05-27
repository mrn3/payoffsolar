import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { Database } from '@/types/database.types';

export type UserRole = 'admin' | 'manager' | 'sales' | 'inventory' | 'customer';

export interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: UserRole | null;
}

export async function getSession() {
  const supabase = createClient();
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      throw error;
    }
    return data.session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = createClient();
  const session = await getSession();
  
  if (!session?.user) {
    return null;
  }
  
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        email,
        roles (
          name
        )
      `)
      .eq('id', session.user.id)
      .single();
    
    if (error) {
      throw error;
    }
    
    if (!profile) {
      return null;
    }
    
    return {
      id: profile.id,
      email: profile.email || session.user.email || '',
      first_name: profile.first_name,
      last_name: profile.last_name,
      role: profile.roles?.name as UserRole || null
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

export async function signIn(email: string, password: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    throw error;
  }
  
  return data;
}

export async function signUp(email: string, password: string, firstName: string, lastName: string) {
  const supabase = createClient();
  
  // Sign up the user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
      },
    },
  });
  
  if (authError) {
    throw authError;
  }
  
  if (!authData.user) {
    throw new Error('User creation failed');
  }
  
  // Create a profile for the user
  const { error: profileError } = await supabase.from('profiles').insert({
    id: authData.user.id,
    first_name: firstName,
    last_name: lastName,
    email: email,
    role_id: await getCustomerRoleId(), // Default to customer role
  });
  
  if (profileError) {
    // If profile creation fails, we should delete the auth user
    await supabase.auth.admin.deleteUser(authData.user.id);
    throw profileError;
  }
  
  return authData;
}

export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    throw error;
  }
  
  redirect('/login');
}

export async function resetPassword(email: string) {
  const supabase = createClient();
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
  });
  
  if (error) {
    throw error;
  }
  
  return true;
}

export async function updatePassword(password: string) {
  const supabase = createClient();
  
  const { error } = await supabase.auth.updateUser({
    password,
  });
  
  if (error) {
    throw error;
  }
  
  return true;
}

export async function getCustomerRoleId(): Promise<string> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('roles')
    .select('id')
    .eq('name', 'customer')
    .single();
  
  if (error || !data) {
    throw error || new Error('Customer role not found');
  }
  
  return data.id;
}

export function createServerSupabaseClient() {
  const cookieStore = cookies();
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
}

export async function requireAuth() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }
  
  return session;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await requireAuth();
  const profile = await getUserProfile();
  
  if (!profile || !profile.role || !allowedRoles.includes(profile.role)) {
    redirect('/dashboard');
  }
  
  return { session, profile };
}
