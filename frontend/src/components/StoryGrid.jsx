import React from 'react';
import StoryCard from './StoryCard';
import { BookOpen, Send } from 'lucide-react';

export default function StoryGrid({
  stories = [],
  loading = false,
  onSelectStory,
  activeCategory = 'All',
  searchQuery = '',
}) {
  if (loading) {
    return (
      <div
        className="full-width-container"
        style={{
          width: '100%',
          paddingTop: 32,
          paddingBottom: 48,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 24,
        }}
      >
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-lg)',
              height: 360,
              animation: 'pulse 1.5s infinite ease-in-out',
            }}
          />
        ))}
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div
        className="full-width-container"
        style={{
          width: '100%',
          paddingTop: 80,
          paddingBottom: 80,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}
        >
          <BookOpen size={30} strokeWidth={1.5} />
        </div>

        <h3
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.5rem',
            fontWeight: 600,
            marginBottom: 8,
            color: 'var(--text-primary)',
          }}
        >
          {searchQuery
            ? `No stories found matching "${searchQuery}"`
            : activeCategory !== 'All'
            ? `No stories found in ${activeCategory}`
            : 'No stories published yet'}
        </h3>

        <p
          style={{
            fontSize: '0.9375rem',
            color: 'var(--text-secondary)',
            maxWidth: 480,
            lineHeight: 1.6,
            marginBottom: 24,
          }}
        >
          {searchQuery
            ? 'Try searching with different keywords or clear the search field.'
            : 'Stories added via your Telegram bot will immediately appear here in real time.'}
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 18px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-light)',
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
          }}
        >
          <Send size={15} />
          <span>Open your Telegram bot and send <code>/newstory</code> to publish your first story.</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="full-width-container"
      style={{
        width: '100%',
        paddingTop: 32,
        paddingBottom: 64,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 28,
      }}
    >
      {stories.map((story) => (
        <StoryCard key={story.id} story={story} onSelectStory={onSelectStory} />
      ))}
    </div>
  );
}
