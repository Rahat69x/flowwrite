import { createClient } from '@supabase/supabase-js';

// Retrieve credentials from Vite env or localStorage override
const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('folio_supabase_url') : null;
const storedKey = typeof window !== 'undefined' ? localStorage.getItem('folio_supabase_key') : null;

export const supabaseUrl = storedUrl || envUrl;
export const supabaseAnonKey = storedKey || envKey;

export const isConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('placeholder') &&
  supabaseUrl.startsWith('https://')
);

// Create the Supabase client if configured, otherwise provide safe dummy wrapper
export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Save manual config from the in-app connection modal
 */
export function saveCustomConfig(url, key) {
  if (url && key) {
    localStorage.setItem('folio_supabase_url', url.trim());
    localStorage.setItem('folio_supabase_key', key.trim());
    window.location.reload();
  }
}

/**
 * Clear custom config
 */
export function clearCustomConfig() {
  localStorage.removeItem('folio_supabase_url');
  localStorage.removeItem('folio_supabase_key');
  window.location.reload();
}

/**
 * Get or create a persistent anonymous client ID for guest likes/views
 */
export function getClientId() {
  if (typeof window === 'undefined') return 'server';
  let clientId = localStorage.getItem('folio_client_id');
  if (!clientId) {
    clientId = 'client_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
    localStorage.setItem('folio_client_id', clientId);
  }
  return clientId;
}

// ==============================================================================
// Database Operations
// ==============================================================================

/**
 * Fetch published stories with optional category filtering and search
 */
export async function fetchPublishedStories({ category = 'All', search = '' } = {}) {
  if (!supabase) return { data: [], error: new Error('Supabase not configured') };

  let query = supabase
    .from('stories')
    .select('id, title, slug, excerpt, content, cover_image_url, author_name, category, reading_time_minutes, views, likes, created_at')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (category && category !== 'All') {
    query = query.eq('category', category);
  }

  if (search && search.trim()) {
    const s = `%${search.trim()}%`;
    query = query.or(`title.ilike.${s},excerpt.ilike.${s},author_name.ilike.${s}`);
  }

  const { data, error } = await query;
  return { data: data || [], error };
}

/**
 * Fetch a single story by slug
 */
export async function fetchStoryBySlug(slug) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('slug', slug)
    .single();

  return { data, error };
}

/**
 * Record a story view atomically
 */
export async function recordStoryView(storyId) {
  if (!supabase || !storyId) return;

  // Session-based deduplication so rapid refreshes don't spam views
  const sessionKey = `viewed_${storyId}`;
  if (sessionStorage.getItem(sessionKey)) return;
  sessionStorage.setItem(sessionKey, 'true');

  try {
    // Try atomic RPC function first
    const { error } = await supabase.rpc('increment_story_views', { story_id: storyId });
    if (error) {
      // Fallback: direct update if RPC is missing
      const { data } = await supabase.from('stories').select('views').eq('id', storyId).single();
      if (data) {
        await supabase.from('stories').update({ views: (data.views || 0) + 1 }).eq('id', storyId);
      }
    }
  } catch (err) {
    console.warn('Could not increment view count:', err);
  }
}

/**
 * Check if the current user or guest has liked this story
 */
export async function checkStoryLiked(storyId, userId) {
  if (!supabase || !storyId) return false;

  const clientId = getClientId();

  try {
    let query = supabase.from('story_likes').select('id').eq('story_id', storyId);

    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      query = query.eq('client_id', clientId);
    }

    const { data } = await query.limit(1);
    return Boolean(data && data.length > 0);
  } catch {
    return false;
  }
}

/**
 * Toggle like for a story
 */
export async function toggleStoryLike(storyId, userId) {
  if (!supabase || !storyId) return { liked: false, likes: 0 };

  const clientId = getClientId();

  try {
    // Try RPC function first
    const { data, error } = await supabase.rpc('toggle_story_like', {
      p_story_id: storyId,
      p_client_id: clientId,
      p_user_id: userId || null,
    });

    if (!error && data) {
      return data;
    }

    // Fallback: manual toggle if RPC function is not created
    const isCurrentlyLiked = await checkStoryLiked(storyId, userId);
    const { data: storyData } = await supabase.from('stories').select('likes').eq('id', storyId).single();
    let currentLikes = storyData?.likes || 0;

    if (isCurrentlyLiked) {
      let deleteQuery = supabase.from('story_likes').delete().eq('story_id', storyId);
      if (userId) {
        deleteQuery = deleteQuery.eq('user_id', userId);
      } else {
        deleteQuery = deleteQuery.eq('client_id', clientId);
      }
      await deleteQuery;
      const newLikes = Math.max(0, currentLikes - 1);
      await supabase.from('stories').update({ likes: newLikes }).eq('id', storyId);
      return { liked: false, likes: newLikes };
    } else {
      await supabase.from('story_likes').insert([
        {
          story_id: storyId,
          user_id: userId || null,
          client_id: userId ? null : clientId,
        },
      ]);
      const newLikes = currentLikes + 1;
      await supabase.from('stories').update({ likes: newLikes }).eq('id', storyId);
      return { liked: true, likes: newLikes };
    }
  } catch (err) {
    console.error('Error toggling like:', err);
    throw err;
  }
}
