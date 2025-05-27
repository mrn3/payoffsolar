'use server';

import { signIn, signUp, signOut } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
});

export async function signInAction(formData: FormData) {
  try {
    const rawData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    };

    const validatedData = signInSchema.parse(rawData);
    
    await signIn(validatedData.email, validatedData.password);
    
    redirect('/dashboard');
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw new Error(error.message || 'Failed to sign in');
  }
}

export async function signUpAction(formData: FormData) {
  try {
    const rawData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
    };

    const validatedData = signUpSchema.parse(rawData);
    
    await signUp(
      validatedData.email,
      validatedData.password,
      validatedData.firstName,
      validatedData.lastName
    );
    
    redirect('/dashboard');
  } catch (error: any) {
    console.error('Sign up error:', error);
    throw new Error(error.message || 'Failed to create account');
  }
}

export async function signOutAction() {
  await signOut();
}
