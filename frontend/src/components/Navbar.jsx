import React, { useState } from 'react';
import { BookOpen, Search, Sun, Moon, User, LogOut, LogIn, Database } from 'lucide-react';
import { isConfigured } from '../lib/supabase';

export default function Navbar({
  theme,
  onToggleTheme,
  searchQuery,
  onSearchChange,
  currentUser,
  onOpenAuth,
  onSignOut,
  onOpenDbConfig,
  onNavigateHome,
}) {
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  return (
    <header
      style={{
        width: '100%',
        backgroundColor: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-light)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        className="full-width-container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 64,
          gap: 16,
        }}
      >
        {/* Brand / Logo */}
        <div
          onClick={onNavigateHome}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--text-inverted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BookOpen size={18} strokeWidth={2.2} />
          </div>
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.25rem',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                color: 'var(--text-primary)',
              }}
            >
              THE CHRONICLE
            </h1>
            <span
              style={{
                fontSize: '0.6875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-muted)',
                fontWeight: 600,
              }}
            >
              Independent Short Stories
            </span>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div
          style={{
            flex: 1,
            maxWidth: 420,
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: 12,
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Search stories by title or author..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 14px 8px 36px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-medium)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              outline: 'none',
              transition: 'var(--transition)',
            }}
          />
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* DB Indicator */}
          <button
            onClick={onOpenDbConfig}
            title={isConfigured ? 'Connected to live Supabase DB' : 'Configure Supabase DB'}
            className="btn btn-subtle btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: isConfigured ? '#16a34a' : '#eab308',
              }}
            />
            <Database size={15} />
            <span style={{ fontSize: '0.75rem', display: 'none', md: 'inline' }}>
              {isConfigured ? 'Live DB' : 'Setup DB'}
            </span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            className="btn btn-subtle btn-sm"
            style={{ padding: '8px' }}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {/* Authentication */}
          {currentUser ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="btn btn-outline btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent-primary)',
                    color: 'var(--text-inverted)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {currentUser.email ? currentUser.email[0].toUpperCase() : 'U'}
                </div>
                <span
                  style={{
                    maxWidth: 120,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontSize: '0.8125rem',
                  }}
                >
                  {currentUser.email}
                </span>
              </button>

              {showUserDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    minWidth: 200,
                    padding: '8px 0',
                    zIndex: 200,
                  }}
                >
                  <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Signed in as</div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, wordBreak: 'break-all' }}>
                      {currentUser.email}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onSignOut();
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: '0.875rem',
                      color: 'var(--text-primary)',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <LogIn size={15} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
