import WebSocket from 'ws';

// Polyfill native WebSocket for Node environments < 22 on hosting platforms like Render
if (!globalThis.WebSocket) {
  globalThis.WebSocket = WebSocket;
}

import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';

let supabaseClient = null;

export function getSupabase() {
  if (!supabaseClient) {
    if (!config.supabaseUrl || !config.supabaseKey) {
      throw new Error('Supabase URL or Key is missing. Check your environment variables.');
    }
    supabaseClient = createClient(config.supabaseUrl, config.supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      realtime: {
        websocket: WebSocket,
      },
    });
  }
  return supabaseClient;
}

/**
 * Download a file from Telegram using native fetch
 */
export async function downloadTelegramFile(fileUrl) {
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch file from Telegram: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Ensure storage bucket exists
 */
export async function ensureBucket() {
  const supabase = getSupabase();
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const hasBucket = buckets?.some((b) => b.name === 'story-covers');
    if (!hasBucket) {
      console.log('[Storage] Creating public bucket story-covers...');
      await supabase.storage.createBucket('story-covers', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });
    }
  } catch (err) {
    console.warn('[Storage] Bucket check warning:', err.message);
  }
}

/**
 * Upload a photo buffer to Supabase Storage bucket 'story-covers'
 */
export async function uploadCoverImage(buffer, extension = 'jpg', mimeType = 'image/jpeg') {
  const supabase = getSupabase();
  await ensureBucket();

  const filename = `cover_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;
  
  const { data, error } = await supabase.storage
    .from('story-covers')
    .upload(filename, buffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    console.error('Supabase storage upload error:', error);
    throw error;
  }

  const { data: publicUrlData } = supabase.storage
    .from('story-covers')
    .getPublicUrl(filename);

  return publicUrlData.publicUrl;
}

/**
 * Fetch stories with pagination
 */
export async function fetchStories({ page = 1, limit = 8, publishedOnly = false } = {}) {
  const supabase = getSupabase();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('stories')
    .select('id, title, slug, category, views, likes, is_published, created_at, cover_image_url', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (publishedOnly) {
    query = query.eq('is_published', true);
  }

  const { data, count, error } = await query;
  if (error) throw error;

  return {
    stories: data || [],
    totalCount: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
    currentPage: page,
  };
}

/**
 * Fetch single story by ID
 */
export async function fetchStoryById(id) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Insert new story
 */
export async function insertStory(story) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('stories')
    .insert([story])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update existing story
 */
export async function updateStory(id, updates) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('stories')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete story by ID
 */
export async function deleteStory(id) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('stories')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

/**
 * Get dashboard analytics overview
 */
export async function getDashboardStats() {
  const supabase = getSupabase();

  const [storiesRes, topStoriesRes] = await Promise.all([
    supabase.from('stories').select('id, views, likes, is_published'),
    supabase
      .from('stories')
      .select('id, title, views, likes, slug')
      .order('views', { ascending: false })
      .limit(3),
  ]);

  if (storiesRes.error) throw storiesRes.error;

  const all = storiesRes.data || [];
  const totalStories = all.length;
  const publishedStories = all.filter((s) => s.is_published).length;
  const draftStories = totalStories - publishedStories;
  const totalViews = all.reduce((acc, curr) => acc + (curr.views || 0), 0);
  const totalLikes = all.reduce((acc, curr) => acc + (curr.likes || 0), 0);

  return {
    totalStories,
    publishedStories,
    draftStories,
    totalViews,
    totalLikes,
    topStories: topStoriesRes.data || [],
  };
}
