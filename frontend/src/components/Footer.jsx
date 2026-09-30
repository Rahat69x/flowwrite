import React from 'react';
import { BookOpen, Send, Database } from 'lucide-react';

export default function Footer({ onOpenDbConfig }) {
  return (
    <footer
      style={{
        width: '100%',
        backgroundColor: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-light)',
        marginTop: 'auto',
        paddingTop: 48,
        paddingBottom: 48,
      }}
    >
      <div
        className="full-width-container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--text-inverted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BookOpen size={16} />
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                }}
              >
                THE CHRONICLE
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Stories published via Telegram • Stored in Supabase • Hosted on Vercel
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={onOpenDbConfig}
              className="btn btn-subtle btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Database size={14} />
              <span>Database Status</span>
            </button>
          </div>
        </div>

        <div
          style={{
            paddingTop: 20,
            borderTop: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            fontSize: '0.8125rem',
            color: 'var(--text-muted)',
          }}
        >
          <div>
            © {new Date().getFullYear()} The Chronicle. All stories belong to their respective authors.
          </div>
          <div>
            100% Full-Width Editorial Layout
          </div>
        </div>
      </div>
    </footer>
  );
}
