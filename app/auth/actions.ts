'use server';

import { signIn, signOut } from '@/auth';
import { redirect } from 'next/navigation';

export async function login() {
  redirect('/auth/signin');
}

export async function logout() {
  await signOut({ redirectTo: '/' });
}

export async function signup() {
  redirect('/auth/signin');
}

export async function resetPassword() {
  // Future: implement password reset flow
  return { success: true, message: 'Password reset not yet implemented.' };
}
