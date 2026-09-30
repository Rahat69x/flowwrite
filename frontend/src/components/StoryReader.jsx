import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Heart,
  Eye,
  Clock,
  Calendar,
  Share2,
  Bookmark,
  Type,
  Check,
} from 'lucide-react';
import { recordStoryView, toggleStoryLike, checkStoryLiked } from '../lib/supabase';

export default function StoryReader({
  story,
  currentUser,
  onBack,
  onShowToast,
  onOpenAuth,
}) {
  const [likesCount, setLikesCount] = useState(story.likes || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [viewsCount, setViewsCount] = useState(story.views || 0);
  const [fontSize, setFontSize] = useState(1.18); // rem
  const [fontFamily, setFontFamily] = useState('serif'); // 'serif' | 'sans'
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isLiking, setIsLiking] = useState(false);

  // Record view count and check like status on mount
  useEffect(() => {
    window.scrollTo(0, 0);

    // Record view in database
    recordStoryView(story.id);
    setViewsCount((prev) => prev + 1);

    // Check if user already liked
    checkStoryLiked(story.id, currentUser?.id).then((liked) => {
      setIsLiked(liked);
    });

    // Scroll progress handler
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (windowHeight > 0) {
        setScrollProgress((totalScroll / windowHeight) * 100);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [story.id, currentUser]);

  // Handle Like Button Toggle
  const handleToggleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);

    // Optimistic UI update
    const nextLiked = !isLiked;
    const nextLikes = nextLiked ? likesCount + 1 : Math.max(0, likesCount - 1);
    setIsLiked(nextLiked);
    setLikesCount(nextLikes);

    try {
      const res = await toggleStoryLike(story.id, currentUser?.id);
      if (res && typeof res.likes === 'number') {
        setLikesCount(res.likes);
        setIsLiked(res.liked);
      }
      if (nextLiked) {
        onShowToast?.('Thank you for liking this story!', 'success');
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);
      // Revert on error
      setIsLiked(!nextLiked);
      setLikesCount(likesCount);
      onShowToast?.('Could not update like. Please try again.', 'error');
    } finally {
      setIsLiking(false);
    }
  };

  // Handle Share link
  const handleShare = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      onShowToast?.('Link copied to clipboard!', 'success');
    } else {
      onShowToast?.(url, 'info');
    }
  };

  const formattedDate = new Date(story.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Split story into paragraphs
  const paragraphs = (story.content || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <article style={{ width: '100%', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      {/* Top Reading Progress Bar */}
      <div
        className="scroll-progress-bar"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Top Navigation Bar for Reader */}
      <div
        style={{
          width: '100%',
          backgroundColor: 'var(--bg-primary)',
          borderBottom: '1px solid var(--border-light)',
          position: 'sticky',
          top: 0,
          zIndex: 90,
        }}
      >
        <div
          className="full-width-container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 56,
          }}
        >
          <button
            onClick={onBack}
            className="btn btn-subtle btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
          >
            <ArrowLeft size={16} />
            <span>All Stories</span>
          </button>

          {/* Reading Customization Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Font Family Switcher */}
            <button
              onClick={() => setFontFamily(fontFamily === 'serif' ? 'sans' : 'serif')}
              className="btn btn-outline btn-sm"
              title="Toggle Serif / Sans-serif typography"
              style={{ padding: '6px 10px', fontSize: '0.75rem', fontWeight: 600 }}
            >
              <Type size={14} />
              <span>{fontFamily === 'serif' ? 'Serif' : 'Sans'}</span>
            </button>

            {/* Font Size Adjusters */}
            <button
              onClick={() => setFontSize((s) => Math.max(0.95, s - 0.1))}
              className="btn btn-outline btn-sm"
              title="Decrease text size"
              style={{ padding: '6px 10px', fontWeight: 700 }}
            >
              A-
            </button>
            <button
              onClick={() => setFontSize((s) => Math.min(1.5, s + 0.1))}
              className="btn btn-outline btn-sm"
              title="Increase text size"
              style={{ padding: '6px 10px', fontWeight: 700 }}
            >
              A+
            </button>

            {/* Like Button */}
            <button
              onClick={handleToggleLike}
              className="btn btn-sm"
              style={{
                backgroundColor: isLiked ? 'var(--like-bg)' : 'var(--bg-secondary)',
                color: isLiked ? 'var(--like-color)' : 'var(--text-primary)',
                border: `1px solid ${isLiked ? 'var(--like-color)' : 'var(--border-medium)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: 600,
              }}
            >
              <Heart
                size={16}
                color="var(--like-color)"
                fill={isLiked ? 'var(--like-color)' : 'none'}
              />
              <span>{likesCount}</span>
            </button>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="btn btn-outline btn-sm"
              title="Share story"
              style={{ padding: '6px 10px' }}
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Story Header Banner (100% full-width layout) */}
      <header
        style={{
          width: '100%',
          backgroundColor: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-light)',
          paddingTop: 'clamp(32px, 5vw, 64px)',
          paddingBottom: 'clamp(32px, 5vw, 56px)',
        }}
      >
        <div className="full-width-container" style={{ width: '100%' }}>
          <div
            style={{
              maxWidth: 820,
              margin: '0 auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span className="badge badge-dark">{story.category}</span>
              <span
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Clock size={13} />
                {story.reading_time_minutes || 3} min read
              </span>
            </div>

            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(2.2rem, 4.5vw, 3.5rem)',
                fontWeight: 700,
                lineHeight: 1.15,
                letterSpacing: '-0.025em',
                color: 'var(--text-primary)',
                marginBottom: 20,
              }}
            >
              {story.title}
            </h1>

            {story.excerpt && (
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.25rem',
                  lineHeight: 1.5,
                  color: 'var(--text-secondary)',
                  fontStyle: 'italic',
                  marginBottom: 28,
                }}
              >
                {story.excerpt}
              </p>
            )}

            {/* Byline and Engagement Stats */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16,
                paddingTop: 16,
                borderTop: '1px solid var(--border-medium)',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent-primary)',
                    color: 'var(--text-inverted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                  }}
                >
                  {(story.author_name || 'E')[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {story.author_name || 'Editorial Desk'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Published on {formattedDate}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Eye size={16} />
                  <span>{viewsCount} views</span>
                </span>
                <button
                  onClick={handleToggleLike}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    color: isLiked ? 'var(--like-color)' : 'inherit',
                    fontWeight: 600,
                  }}
                >
                  <Heart
                    size={16}
                    color="var(--like-color)"
                    fill={isLiked ? 'var(--like-color)' : 'none'}
                  />
                  <span>{likesCount} likes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Story Cover Image (100% full-width container) */}
      {story.cover_image_url && (
        <div
          className="full-width-container"
          style={{
            width: '100%',
            paddingTop: 40,
            paddingBottom: 20,
          }}
        >
          <div
            style={{
              maxWidth: 960,
              margin: '0 auto',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-md)',
              border: '1px solid var(--border-light)',
            }}
          >
            <img
              src={story.cover_image_url}
              alt={story.title}
              style={{
                width: '100%',
                maxHeight: 540,
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </div>
        </div>
      )}

      {/* Story Body Content - Set with optimal line measure within 100% container */}
      <main
        className="full-width-container"
        style={{
          width: '100%',
          paddingTop: 40,
          paddingBottom: 80,
        }}
      >
        <div
          style={{
            maxWidth: 740,
            margin: '0 auto',
            fontFamily: fontFamily === 'serif' ? 'var(--font-serif)' : 'var(--font-sans)',
            fontSize: `${fontSize}rem`,
            lineHeight: 1.85,
            color: 'var(--text-primary)',
            letterSpacing: fontFamily === 'serif' ? '0.005em' : 'normal',
          }}
        >
          {paragraphs.map((p, idx) => (
            <p
              key={idx}
              style={{
                marginBottom: '1.6em',
                textAlign: 'left',
              }}
            >
              {idx === 0 && (
                <span
                  style={{
                    float: 'left',
                    fontFamily: 'var(--font-serif)',
                    fontSize: '3.6em',
                    lineHeight: '0.8',
                    paddingTop: '4px',
                    paddingRight: '10px',
                    paddingBottom: '0',
                    color: 'var(--accent-primary)',
                    fontWeight: 700,
                  }}
                >
                  {p.charAt(0)}
                </span>
              )}
              {idx === 0 ? p.slice(1) : p}
            </p>
          ))}
        </div>

        {/* End of Story Divider & Like Action */}
        <div
          style={{
            maxWidth: 740,
            margin: '60px auto 0 auto',
            paddingTop: 36,
            borderTop: '2px solid var(--border-medium)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.125rem',
              color: 'var(--text-secondary)',
              marginBottom: 16,
              fontStyle: 'italic',
            }}
          >
            Enjoyed reading this piece?
          </p>

          <button
            onClick={handleToggleLike}
            className="btn btn-lg"
            style={{
              backgroundColor: isLiked ? 'var(--like-bg)' : 'var(--accent-primary)',
              color: isLiked ? 'var(--like-color)' : 'var(--text-inverted)',
              border: `1px solid ${isLiked ? 'var(--like-color)' : 'var(--accent-primary)'}`,
              gap: 10,
              fontWeight: 600,
              padding: '12px 28px',
              borderRadius: 'var(--radius-full)',
              boxShadow: 'var(--shadow-md)',
              transition: 'transform 0.15s ease',
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.96)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <Heart
              size={20}
              color={isLiked ? 'var(--like-color)' : '#ffffff'}
              fill={isLiked ? 'var(--like-color)' : '#ffffff'}
            />
            <span>{isLiked ? `Liked (${likesCount})` : `Like this story (${likesCount})`}</span>
          </button>

          <div style={{ marginTop: 32 }}>
            <button onClick={onBack} className="btn btn-outline" style={{ gap: 8 }}>
              <ArrowLeft size={16} />
              <span>Back to all stories</span>
            </button>
          </div>
        </div>
      </main>
    </article>
  );
}
