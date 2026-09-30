import React from 'react';
import { Eye, Heart, Clock, Calendar } from 'lucide-react';

export default function StoryCard({ story, onSelectStory }) {
  const formattedDate = new Date(story.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <article
      onClick={() => onSelectStory(story)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-light)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.borderColor = 'var(--border-medium)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.borderColor = 'var(--border-light)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Cover Image Container */}
      <div
        style={{
          width: '100%',
          aspectRatio: '16 / 10',
          backgroundColor: 'var(--bg-tertiary)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {story.cover_image_url ? (
          <img
            src={story.cover_image_url}
            alt={story.title}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.3s ease',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-muted)',
              fontSize: '0.875rem',
            }}
          >
            No cover image
          </div>
        )}

        {/* Category Badge overlay */}
        <div style={{ position: 'absolute', top: 12, left: 12 }}>
          <span className="badge badge-dark" style={{ backdropFilter: 'blur(4px)' }}>
            {story.category}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            marginBottom: 8,
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Calendar size={13} />
            {formattedDate}
          </span>
          <span>•</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={13} />
            {story.reading_time_minutes || 3} min read
          </span>
        </div>

        <h3
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.25rem',
            fontWeight: 600,
            lineHeight: 1.3,
            color: 'var(--text-primary)',
            marginBottom: 8,
          }}
        >
          {story.title}
        </h3>

        {story.excerpt && (
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              marginBottom: 16,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              flex: 1,
            }}
          >
            {story.excerpt}
          </p>
        )}

        {/* Footer info: author and stats */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 12,
            borderTop: '1px solid var(--border-light)',
            marginTop: 'auto',
          }}
        >
          <span
            style={{
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: 'var(--text-primary)',
            }}
          >
            By {story.author_name || 'Editorial Desk'}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }} title="Total Views">
              <Eye size={14} />
              {story.views || 0}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }} title="Likes">
              <Heart size={14} color="var(--like-color)" fill="var(--like-color)" />
              {story.likes || 0}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
