'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

/* ─── Icon SVGs ─────────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.032.054a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  );
}

/* ─── Input Component ────────────────────────────────────── */
function Input({
  id, label, type = 'text', placeholder, value, onChange, required = false,
}: {
  id: string; label: string; type?: string; placeholder?: string;
  value: string; onChange: (v: string) => void; required?: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label htmlFor={id} style={{ fontSize: '13px', fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.03em' }}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '10px',
          padding: '11px 16px',
          color: '#F2F2F0',
          fontSize: '14px',
          fontFamily: 'Inter, sans-serif',
          outline: 'none',
          transition: 'border-color 0.2s',
          width: '100%',
          boxSizing: 'border-box',
        }}
        onFocus={(e) => { e.target.style.borderColor = 'rgba(123,16,22,0.6)'; }}
        onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
      />
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────── */
function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const urlError = searchParams.get('error');

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(urlError || '');
  const [success, setSuccess] = useState('');

  // Sign-in fields
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');

  // Sign-up fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleOAuth = async (provider: 'google' | 'discord') => {
    setLoading(true);
    setError('');
    await signIn(provider, { callbackUrl });
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      emailOrUsername,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('Invalid email/username or password.');
      setLoading(false);
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, username, email, password: signupPassword, confirmPassword }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Sign-up failed.');
      setLoading(false);
      return;
    }

    // Auto sign-in after registration
    const result = await signIn('credentials', {
      emailOrUsername: email,
      password: signupPassword,
      redirect: false,
    });

    if (result?.error) {
      setSuccess('Account created! Please sign in.');
      setMode('signin');
      setLoading(false);
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  };

  const cardStyle: React.CSSProperties = {
    background: 'rgba(15,15,15,0.95)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '24px',
    padding: '40px',
    width: '100%',
    maxWidth: '440px',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 25px 50px rgba(0,0,0,0.6), 0 0 80px rgba(123,16,22,0.08)',
  };

  const oauthBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '12px 20px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.04)',
    color: '#ECE8DD',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'Inter, sans-serif',
    width: '100%',
  };

  const primaryBtnStyle: React.CSSProperties = {
    width: '100%',
    background: 'linear-gradient(135deg, #7B1016 0%, #9B1520 100%)',
    border: 'none',
    color: '#fff',
    padding: '13px 20px',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 700,
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'Inter, sans-serif',
    opacity: loading ? 0.7 : 1,
    letterSpacing: '0.05em',
    boxShadow: '0 4px 20px rgba(123,16,22,0.3)',
    marginTop: '4px',
  };

  const dividerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: '#4B5563',
    fontSize: '12px',
    fontWeight: 600,
    margin: '8px 0',
  };

  const lineStyle: React.CSSProperties = {
    flex: 1,
    height: '1px',
    background: 'rgba(255,255,255,0.06)',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080808',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'Inter, system-ui, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '-200px', left: '50%', transform: 'translateX(-50%)',
        width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(123,16,22,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={cardStyle}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '0.2em', color: '#F2F2F0', fontFamily: 'serif' }}>
              VOU<span style={{ color: '#B1222E' }}>XA</span>
            </div>
          </Link>
          <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '8px' }}>
            {mode === 'signin' ? 'Welcome back. Sign in to continue.' : 'Create your VOUXA account.'}
          </p>
        </div>

        {/* Error / Success banners */}
        {error && (
          <div style={{
            background: 'rgba(185,28,28,0.15)', border: '1px solid rgba(185,28,28,0.3)',
            borderRadius: '10px', padding: '12px 16px', marginBottom: '20px',
            color: '#FCA5A5', fontSize: '13px', fontWeight: 500,
          }}>
            {error === 'OAuthSignin' || error === 'OAuthCallback' ? 'OAuth sign-in failed. Please try again.' : error}
          </div>
        )}
        {success && (
          <div style={{
            background: 'rgba(21,128,61,0.15)', border: '1px solid rgba(21,128,61,0.3)',
            borderRadius: '10px', padding: '12px 16px', marginBottom: '20px',
            color: '#86EFAC', fontSize: '13px', fontWeight: 500,
          }}>
            {success}
          </div>
        )}

        {/* OAuth Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
          <button
            id="btn-google-signin"
            onClick={() => handleOAuth('google')}
            disabled={loading}
            style={oauthBtnStyle}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <button
            id="btn-discord-signin"
            onClick={() => handleOAuth('discord')}
            disabled={loading}
            style={{ ...oauthBtnStyle, color: '#C8AEFF' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(88,101,242,0.12)'; e.currentTarget.style.borderColor = 'rgba(88,101,242,0.3)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          >
            <DiscordIcon />
            Continue with Discord
          </button>
        </div>

        {/* Divider */}
        <div style={dividerStyle}>
          <div style={lineStyle} />
          <span>OR</span>
          <div style={lineStyle} />
        </div>

        {/* Credentials Form */}
        {mode === 'signin' ? (
          <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
            <Input id="emailOrUsername" label="Email or Username" placeholder="yourname@email.com" value={emailOrUsername} onChange={setEmailOrUsername} required />
            <Input id="signinPassword" label="Password" type="password" placeholder="••••••••" value={password} onChange={setPassword} required />
            <button id="btn-signin" type="submit" disabled={loading} style={primaryBtnStyle}>
              {loading ? 'Signing In…' : 'SIGN IN'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input id="firstName" label="First Name" placeholder="John" value={firstName} onChange={setFirstName} required />
              <Input id="lastName" label="Last Name" placeholder="Doe" value={lastName} onChange={setLastName} required />
            </div>
            <Input id="signupUsername" label="Username" placeholder="johndoe" value={username} onChange={setUsername} required />
            <Input id="signupEmail" label="Email" type="email" placeholder="john@email.com" value={email} onChange={setEmail} required />
            <Input id="signupPassword" label="Password" type="password" placeholder="Min. 8 characters" value={signupPassword} onChange={setSignupPassword} required />
            <Input id="confirmPassword" label="Confirm Password" type="password" placeholder="Re-enter password" value={confirmPassword} onChange={setConfirmPassword} required />
            <button id="btn-signup" type="submit" disabled={loading} style={primaryBtnStyle}>
              {loading ? 'Creating Account…' : 'CREATE ACCOUNT'}
            </button>
          </form>
        )}

        {/* Toggle Mode */}
        <p style={{ textAlign: 'center', color: '#6B7280', fontSize: '13px', marginTop: '24px' }}>
          {mode === 'signin' ? (
            <>
              Don&apos;t have an account?{' '}
              <button
                id="btn-switch-signup"
                onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
                style={{ background: 'none', border: 'none', color: '#B1222E', cursor: 'pointer', fontWeight: 700, fontSize: '13px', fontFamily: 'Inter, sans-serif' }}
              >
                Create Account
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                id="btn-switch-signin"
                onClick={() => { setMode('signin'); setError(''); setSuccess(''); }}
                style={{ background: 'none', border: 'none', color: '#B1222E', cursor: 'pointer', fontWeight: 700, fontSize: '13px', fontFamily: 'Inter, sans-serif' }}
              >
                Sign In
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInContent />
    </Suspense>
  );
}
