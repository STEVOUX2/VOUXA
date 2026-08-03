'use server';

import { signOut } from '@/auth';
import { redirect } from 'next/navigation';

export async function login() {
  // This page is replaced by /auth/signin — redirect there
  redirect('/auth/signin');
}

export async function signout() {
  await signOut({ redirectTo: '/' });
}
