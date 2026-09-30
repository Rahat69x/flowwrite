import React from 'react';

const CATEGORIES = [
  'All',
  'Fiction',
  'Non-Fiction',
  'Mystery',
  'Sci-Fi',
  'Drama',
  'Essay',
  'Poetry',
];

export default function CategoryBar({ activeCategory, onSelectCategory, counts = {} }) {
  return (
    <nav
      style={{
        width: '100%',
        backgroundColor: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-light)',
      }}
    >
      <div
        className="full-width-container"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          overflowX: 'auto',
          paddingTop: 10,
          paddingBottom: 10,
          scrollbarWidth: 'none',
        }}
      >
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
            marginRight: 6,
            whiteSpace: 'nowrap',
          }}
        >
          Section:
        </span>

        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat;
          const count = counts[cat];

          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8125rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--text-inverted)' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                border: '1px solid',
                borderColor: isActive ? 'var(--accent-primary)' : 'var(--border-light)',
                whiteSpace: 'nowrap',
                transition: 'var(--transition)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>{cat}</span>
              {typeof count === 'number' && (
                <span
                  style={{
                    fontSize: '0.6875rem',
                    opacity: isActive ? 0.9 : 0.6,
                    fontWeight: 700,
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
