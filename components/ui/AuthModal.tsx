'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { login, signup, resetPassword } from '@/app/auth/actions';

export type AuthView = 'signIn' | 'signUp' | 'forgotPassword';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: AuthView;
}

// Reusable animated input component to keep code clean and add focus effects
function AnimatedInput({ label, type, name, placeholder, required }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      <label style={{ fontSize: '13px', fontWeight: 600, color: '#B9B9B9' }}>{label}</label>
      <motion.input 
        name={name} type={type} placeholder={placeholder} required={required}
        whileFocus={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.06)' }}
        initial={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
        style={{
          width: '100%', boxSizing: 'border-box',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '12px 14px', borderRadius: '10px', color: '#F2F2F0', 
          fontSize: '14px', outline: 'none', transition: 'border-color 0.2s',
          // Note: using an inline style block here to override ugly browser autofill
        }}
        className="auth-input"
        onFocus={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'}
        onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
      />
    </div>
  );
}

export function AuthModal({ isOpen, onClose, initialView = 'signIn' }: AuthModalProps) {
  const [view, setView] = useState<AuthView>(initialView);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // We inject a global style for the autofill fix since inline pseudo-classes aren't supported
  useEffect(() => {
    if (!isOpen) return;
    const style = document.createElement('style');
    style.innerHTML = `
      .auth-input:-webkit-autofill,
      .auth-input:-webkit-autofill:hover, 
      .auth-input:-webkit-autofill:focus, 
      .auth-input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px #1a1a1a inset !important;
          -webkit-text-fill-color: #F2F2F0 !important;
          transition: background-color 5000s ease-in-out 0s;
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, [isOpen]);

  const handleClose = () => {
    setView('signIn');
    setError(null);
    setSuccess(null);
    onClose();
  };

  const handleAction = async (_formData: FormData) => {
    // Redirect to new unified auth page
    window.location.href = '/auth/signin';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px',
            background: 'rgba(8,8,8,0.85)', backdropFilter: 'blur(16px)',
          }}
        >
          {/* Close Area */}
          <div style={{ position: 'absolute', inset: 0 }} onClick={handleClose} />

          <motion.div
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'relative', width: '100%', maxWidth: '400px', boxSizing: 'border-box',
              background: 'linear-gradient(145deg, #161616 0%, #080808 100%)', 
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '20px', padding: '36px 32px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
              display: 'flex', flexDirection: 'column', gap: '24px'
            }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                <motion.div 
                  initial={{ rotate: -10, scale: 0.9 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                  style={{
                    width: '48px', height: '48px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #5D0F14, #7B1016, #AA212B)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 14px rgba(123,16,22,0.35), inset 0 2px 4px rgba(255,255,255,0.2)',
                  }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#ECE8DD" style={{ marginLeft: '2px' }}>
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </motion.div>
              </div>
              <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#F2F2F0', margin: '0 0 8px 0', fontFamily: 'Inter, sans-serif' }}>
                {view === 'signIn' ? 'Welcome Back' : view === 'signUp' ? 'Welcome to VOUXA' : 'Reset Password'}
              </h2>
              <p style={{ color: '#7E7E7E', fontSize: '15px', margin: 0 }}>
                {view === 'signIn' ? 'Sign in to sync your Watchlist and History' 
                  : view === 'signUp' ? 'Create an account for the ultimate experience' 
                  : 'Enter your email to receive reset instructions'}
              </p>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                style={{ background: 'rgba(170,33,43,0.1)', border: '1px solid rgba(170,33,43,0.3)', padding: '12px 16px', borderRadius: '8px', color: '#ff6b6b', fontSize: '14px', textAlign: 'center' }}>
                {error}
              </motion.div>
            )}
            
            {success && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                style={{ background: 'rgba(46,160,67,0.1)', border: '1px solid rgba(46,160,67,0.3)', padding: '10px 14px', borderRadius: '8px', color: '#7ee787', fontSize: '13px', textAlign: 'center' }}>
                {success}
              </motion.div>
            )}

            <form action={handleAction} style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
              
              <AnimatePresence mode="popLayout">
                {view === 'signUp' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', width: '100%' }}>
                      <AnimatedInput label="First Name" type="text" name="firstName" required={true} />
                      <AnimatedInput label="Last Name" type="text" name="lastName" required={true} />
                    </div>
                    <AnimatedInput label="Username" type="text" name="username" required={true} />
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatedInput label="Email" type="email" name="email" placeholder="you@gmail.com" required={true} />

              <AnimatePresence mode="popLayout">
                {view !== 'forgotPassword' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <label style={{ fontSize: '13px', fontWeight: 600, color: '#B9B9B9' }}>Password</label>
                      {view === 'signIn' && (
                        <button type="button" onClick={() => setView('forgotPassword')} style={{ background: 'none', border: 'none', color: '#7E7E7E', fontSize: '12px', cursor: 'pointer', padding: 0 }}>
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <motion.input name="password" type="password" required
                      whileFocus={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.06)' }}
                      initial={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        border: '1px solid rgba(255,255,255,0.1)',
                        padding: '12px 14px', borderRadius: '10px', color: '#F2F2F0', 
                        fontSize: '14px', outline: 'none', transition: 'border-color 0.2s'
                      }}
                      className="auth-input"
                      onFocus={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'}
                      onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button type="submit" disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                style={{
                  marginTop: '8px', width: '100%', boxSizing: 'border-box',
                  background: 'linear-gradient(135deg, #F2F2F0, #ECE8DD)', color: '#080808',
                  border: 'none', padding: '14px', borderRadius: '10px',
                  fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  boxShadow: '0 4px 16px rgba(242,242,240,0.15)'
                }}
              >
                {loading ? 'Processing...' : view === 'signIn' ? 'Sign In' : view === 'signUp' ? 'Create Account' : 'Send Reset Link'}
              </motion.button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '8px' }}>
              {view === 'signIn' ? (
                <p style={{ color: '#7E7E7E', fontSize: '14px', margin: 0 }}>
                  New to VOUXA? <button onClick={() => setView('signUp')} style={{ background: 'none', border: 'none', color: '#F2F2F0', fontWeight: 600, cursor: 'pointer', padding: 0 }}>Sign up now</button>
                </p>
              ) : (
                <p style={{ color: '#7E7E7E', fontSize: '14px', margin: 0 }}>
                  {view === 'signUp' ? 'Already have an account?' : 'Remembered your password?'} <button onClick={() => setView('signIn')} style={{ background: 'none', border: 'none', color: '#F2F2F0', fontWeight: 600, cursor: 'pointer', padding: 0 }}>Sign in</button>
                </p>
              )}
            </div>

            {/* Absolute close button (X) */}
            <button onClick={handleClose} style={{
              position: 'absolute', top: '24px', right: '24px',
              background: 'rgba(255,255,255,0.05)', border: 'none', color: '#7E7E7E',
              cursor: 'pointer', padding: '8px', display: 'flex', borderRadius: '50%',
              transition: 'all 0.2s'
            }}
              onMouseEnter={e => { e.currentTarget.style.color = '#F2F2F0'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#7E7E7E'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
