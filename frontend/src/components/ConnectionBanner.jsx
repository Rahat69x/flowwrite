import React, { useState } from 'react';
import { Database, AlertTriangle, Key, X, CheckCircle, ExternalLink } from 'lucide-react';
import { isConfigured, supabaseUrl, saveCustomConfig, clearCustomConfig } from '../lib/supabase';

export default function ConnectionBanner({ onShowToast }) {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState(supabaseUrl || '');
  const [anonKey, setAnonKey] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    if (!url.startsWith('https://')) {
      onShowToast?.('Please enter a valid Supabase URL starting with https://', 'error');
      return;
    }
    if (!anonKey || anonKey.length < 20) {
      onShowToast?.('Please enter a valid Supabase Anon public key', 'error');
      return;
    }

    saveCustomConfig(url, anonKey);
    onShowToast?.('Supabase configuration saved! Reloading...', 'success');
  };

  const handleReset = () => {
    clearCustomConfig();
    onShowToast?.('Credentials cleared. Reloading...', 'info');
  };

  return (
    <>
      {/* Subtle indicator bar if not configured */}
      {!isConfigured && (
        <div
          style={{
            width: '100%',
            backgroundColor: '#fffbeb',
            borderBottom: '1px solid #fef3c7',
            padding: '8px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.85rem',
            color: '#92400e',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} />
            <span>
              <strong>Supabase not connected:</strong> Add your credentials in <code>frontend/.env</code> or click Configure to connect your database.
            </span>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            style={{
              fontWeight: 600,
              textDecoration: 'underline',
              color: '#78350f',
            }}
          >
            Configure Database →
          </button>
        </div>
      )}

      {/* Connection Modal */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            padding: 16,
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: 500,
              width: '100%',
              padding: 28,
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border-medium)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Database size={22} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Database Connection</h3>
              </div>
              <button onClick={() => setIsOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
              The platform connects directly to your Supabase project. Enter your project details below or configure <code>.env</code> in the project root.
            </p>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6 }}>
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  placeholder="https://xyzcompany.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-medium)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6 }}>
                  Supabase Anon Public Key
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-medium)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Save & Connect
                </button>
                {isConfigured && (
                  <button type="button" onClick={handleReset} className="btn btn-outline">
                    Disconnect
                  </button>
                )}
              </div>
            </form>

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-light)', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              <span>Need the database schema? Run the migration script in <code>supabase/schema.sql</code> in your Supabase SQL Editor.</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
