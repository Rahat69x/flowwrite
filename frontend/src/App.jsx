import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import CategoryBar from './components/CategoryBar';
import FeaturedStory from './components/FeaturedStory';
import StoryGrid from './components/StoryGrid';
import StoryReader from './components/StoryReader';
import AuthModal from './components/AuthModal';
import ConnectionBanner from './components/ConnectionBanner';
import Footer from './components/Footer';
import Toast from './components/Toast';
import {
  supabase,
  isConfigured,
  fetchPublishedStories,
  fetchStoryBySlug,
} from './lib/supabase';

export default function App() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('folio_theme') || 'light');
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDbConfigOpen, setIsDbConfigOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('folio_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  // 1. Supabase Auth Listener
  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setCurrentUser(null);
    showToast('Signed out successfully.', 'info');
  };

  // 2. Fetch Stories directly from Supabase
  const loadStories = useCallback(async () => {
    if (!isConfigured) {
      setLoading(false);
      setStories([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await fetchPublishedStories({
        category: activeCategory,
        search: searchQuery,
      });

      if (error) {
        console.error('Error fetching stories:', error);
        showToast(`Failed to load stories: ${error.message}`, 'error');
        setStories([]);
      } else {
        setStories(data || []);
      }
    } catch (err) {
      console.error('Fetch exception:', err);
      setStories([]);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, searchQuery]);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  // 3. Handle Hash Routing for direct story links (e.g. #story-the-clockmaker-of-prague)
  useEffect(() => {
    const handleHashChange = async () => {
      const hash = window.location.hash;
      if (hash.startsWith('#story-')) {
        const slug = hash.replace('#story-', '');
        if (slug) {
          const { data } = await fetchStoryBySlug(slug);
          if (data) {
            setSelectedStory(data);
          }
        }
      } else if (!hash) {
        setSelectedStory(null);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectStory = (story) => {
    setSelectedStory(story);
    window.location.hash = `story-${story.slug}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToStories = () => {
    setSelectedStory(null);
    window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Category counts
  const categoryCounts = stories.reduce((acc, curr) => {
    if (curr.category) {
      acc[curr.category] = (acc[curr.category] || 0) + 1;
    }
    return acc;
  }, {});
  categoryCounts['All'] = stories.length;

  const featuredStory =
    !searchQuery && activeCategory === 'All' && stories.length > 0
      ? stories[0]
      : null;

  const gridStories = featuredStory ? stories.slice(1) : stories;

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ConnectionBanner onShowToast={showToast} />

      <Navbar
        theme={theme}
        onToggleTheme={toggleTheme}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
        onOpenDbConfig={() => setIsDbConfigOpen(true)}
        onNavigateHome={handleBackToStories}
      />

      {selectedStory ? (
        <StoryReader
          story={selectedStory}
          currentUser={currentUser}
          onBack={handleBackToStories}
          onShowToast={showToast}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />
      ) : (
        <main style={{ width: '100%', flex: 1 }}>
          <CategoryBar
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
            counts={categoryCounts}
          />

          {featuredStory && (
            <FeaturedStory
              story={featuredStory}
              onSelectStory={handleSelectStory}
            />
          )}

          <StoryGrid
            stories={gridStories}
            loading={loading}
            onSelectStory={handleSelectStory}
            activeCategory={activeCategory}
            searchQuery={searchQuery}
          />
        </main>
      )}

      <Footer onOpenDbConfig={() => setIsDbConfigOpen(true)} />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onShowToast={showToast}
      />

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'info' })}
      />
    </div>
  );
}
