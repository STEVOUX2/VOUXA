import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, username, email, password, confirmPassword } = body;

    // Validation
    if (!firstName || !lastName || !username || !email || !password) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }
    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }
    if (username.length < 3 || !/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json({
        error: 'Username must be at least 3 characters and contain only letters, numbers, and underscores.',
      }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Check if email already exists
    const { data: existingEmail } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingEmail) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    // Check if username already exists
    const { data: existingUsername } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase())
      .single();

    if (existingUsername) {
      return NextResponse.json({ error: 'This username is already taken.' }, { status: 409 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Insert new profile
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        first_name: firstName,
        last_name: lastName,
        password_hash: passwordHash,
        is_admin: email.toLowerCase() === 'nazcomatrix@gmail.com',
        updated_at: new Date().toISOString(),
      })
      .select('id, email, username')
      .single();

    if (insertError) {
      console.error('Signup insert error:', insertError);
      return NextResponse.json({ error: 'Failed to create account. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: newProfile }, { status: 201 });
  } catch (err) {
    console.error('Signup error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
