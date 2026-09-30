import React from 'react';
import { Eye, Heart, Clock, Calendar, ArrowRight } from 'lucide-react';

export default function FeaturedStory({ story, onSelectStory }) {
  if (!story) return null;

  const formattedDate = new Date(story.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <section
      style={{
        width: '100%',
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-light)',
        paddingTop: 48,
        paddingBottom: 48,
      }}
    >
      <div
        className="full-width-container"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 40,
          alignItems: 'center',
        }}
      >
        {/* Left: Headline & Excerpt */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span className="badge badge-dark">Featured Piece</span>
            <span className="badge">{story.category}</span>
          </div>

          <h2
            onClick={() => onSelectStory(story)}
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
              fontWeight: 700,
              lineHeight: 1.15,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              marginBottom: 16,
              cursor: 'pointer',
            }}
          >
            {story.title}
          </h2>

          {story.excerpt && (
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.125rem',
                lineHeight: 1.6,
                color: 'var(--text-secondary)',
                marginBottom: 24,
              }}
            >
              {story.excerpt}
            </p>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
              fontSize: '0.875rem',
              color: 'var(--text-muted)',
              marginBottom: 24,
            }}
          >
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              By {story.author_name || 'Editorial Desk'}
            </span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={14} />
              {formattedDate}
            </span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={14} />
              {story.reading_time_minutes || 3} min read
            </span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Eye size={14} />
              {story.views || 0} views
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Heart size={14} color="var(--like-color)" fill="var(--like-color)" />
              {story.likes || 0}
            </span>
          </div>

          <div>
            <button
              onClick={() => onSelectStory(story)}
              className="btn btn-primary btn-lg"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}
            >
              <span>Read Full Story</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* Right: Cover Art */}
        <div
          onClick={() => onSelectStory(story)}
          style={{
            width: '100%',
            aspectRatio: '16 / 10',
            maxHeight: 460,
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--border-medium)',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {story.cover_image_url ? (
            <img
              src={story.cover_image_url}
              alt={story.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.4s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
              }}
            >
              Cover Art
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
