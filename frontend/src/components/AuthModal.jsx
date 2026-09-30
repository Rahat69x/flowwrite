import React, { useState } from 'react';
import { X, Mail, Lock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { supabase, isConfigured } from '../lib/supabase';

export default function AuthModal({ isOpen, onClose, onShowToast }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'magic'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!isConfigured) {
      setErrorMsg('Supabase is not configured yet. Please configure your Supabase URL & Key first.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        onShowToast?.('Signed in successfully!', 'success');
        onClose();
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;

        if (data.session) {
          onShowToast?.('Account created and signed in!', 'success');
          onClose();
        } else {
          setSuccessMsg('Account created! Please check your email inbox to confirm your address.');
        }
      } else if (mode === 'magic') {
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: {
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        setSuccessMsg('Magic login link has been sent to your email address!');
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setErrorMsg(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3000,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          color: 'var(--text-primary)',
          borderRadius: 'var(--radius-lg)',
          maxWidth: 420,
          width: '100%',
          padding: 32,
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-medium)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 18,
            right: 18,
            color: 'var(--text-muted)',
            display: 'flex',
          }}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.75rem',
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: 6,
            }}
          >
            {mode === 'signin' && 'Welcome Back'}
            {mode === 'signup' && 'Create Your Account'}
            {mode === 'magic' && 'Sign In via Magic Link'}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {mode === 'signin' && 'Sign in to sync your saved stories and reading history.'}
            {mode === 'signup' && 'Join readers worldwide with basic email login.'}
            {mode === 'magic' && 'We will email you a passwordless sign-in link.'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            padding: 4,
            marginBottom: 20,
            border: '1px solid var(--border-light)',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            style={{
              flex: 1,
              padding: '8px 0',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8125rem',
              fontWeight: mode === 'signin' ? 600 : 500,
              backgroundColor: mode === 'signin' ? 'var(--bg-card)' : 'transparent',
              color: mode === 'signin' ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: mode === 'signin' ? 'var(--shadow-sm)' : 'none',
              transition: 'var(--transition)',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            style={{
              flex: 1,
              padding: '8px 0',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8125rem',
              fontWeight: mode === 'signup' ? 600 : 500,
              backgroundColor: mode === 'signup' ? 'var(--bg-card)' : 'transparent',
              color: mode === 'signup' ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: mode === 'signup' ? 'var(--shadow-sm)' : 'none',
              transition: 'var(--transition)',
            }}
          >
            Create Account
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              padding: '10px 12px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fee2e2',
              borderRadius: 'var(--radius-md)',
              color: '#991b1b',
              fontSize: '0.8125rem',
              marginBottom: 16,
            }}
          >
            <AlertCircle size={16} style={{ marginTop: 2, flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              padding: '10px 12px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #dcfce7',
              borderRadius: 'var(--radius-md)',
              color: '#166534',
              fontSize: '0.8125rem',
              marginBottom: 16,
            }}
          >
            <CheckCircle2 size={16} style={{ marginTop: 2, flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 600,
                marginBottom: 6,
                color: 'var(--text-primary)',
              }}
            >
              Email Address
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Mail
                size={16}
                style={{
                  position: 'absolute',
                  left: 12,
                  color: 'var(--text-muted)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="email"
                placeholder="reader@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {mode !== 'magic' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  Password
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('magic');
                      setErrorMsg('');
                    }}
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      textDecoration: 'underline',
                    }}
                  >
                    Use magic link instead
                  </button>
                )}
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: 12,
                    color: 'var(--text-muted)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-medium)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              padding: '12px 16px',
              fontWeight: 600,
              fontSize: '0.9375rem',
              marginTop: 6,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <span>Connecting...</span>
            ) : (
              <>
                <span>
                  {mode === 'signin' && 'Sign In'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'magic' && 'Send Magic Link'}
                </span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
