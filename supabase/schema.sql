-- ==============================================================================
-- Story Platform - Supabase Schema Migration
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Stories Table
CREATE TABLE IF NOT EXISTS public.stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    cover_image_url TEXT,
    author_name TEXT NOT NULL DEFAULT 'Editorial Desk',
    category TEXT NOT NULL DEFAULT 'Fiction',
    reading_time_minutes INTEGER NOT NULL DEFAULT 3,
    views INTEGER NOT NULL DEFAULT 0,
    likes INTEGER NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT true,
    telegram_message_id BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_stories_published_created 
    ON public.stories (is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_slug 
    ON public.stories (slug);
CREATE INDEX IF NOT EXISTS idx_stories_category 
    ON public.stories (category);

-- 3. Story Likes Table (Supports both logged-in users and client session IDs)
CREATE TABLE IF NOT EXISTS public.story_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_story_like UNIQUE (story_id, user_id),
    CONSTRAINT unique_client_story_like UNIQUE (story_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_story_likes_story_id 
    ON public.story_likes (story_id);
CREATE INDEX IF NOT EXISTS idx_story_likes_user_id 
    ON public.story_likes (user_id);
CREATE INDEX IF NOT EXISTS idx_story_likes_client_id 
    ON public.story_likes (client_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_likes ENABLE ROW LEVEL SECURITY;

-- 5. Stories Policies
-- Public can read all published stories
DROP POLICY IF EXISTS "Public can view published stories" ON public.stories;
CREATE POLICY "Public can view published stories" 
    ON public.stories 
    FOR SELECT 
    USING (is_published = true);

-- Service role (Telegram bot / backend) has full access
DROP POLICY IF EXISTS "Service role has full access to stories" ON public.stories;
CREATE POLICY "Service role has full access to stories" 
    ON public.stories 
    FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

-- Authenticated users (admin) can also read all stories if needed
DROP POLICY IF EXISTS "Authenticated can view all stories" ON public.stories;
CREATE POLICY "Authenticated can view all stories" 
    ON public.stories 
    FOR SELECT 
    TO authenticated 
    USING (true);

-- 6. Story Likes Policies
-- Anyone can view likes
DROP POLICY IF EXISTS "Anyone can view story likes" ON public.story_likes;
CREATE POLICY "Anyone can view story likes" 
    ON public.story_likes 
    FOR SELECT 
    USING (true);

-- Users / Guests can insert their own like
DROP POLICY IF EXISTS "Users can insert like" ON public.story_likes;
CREATE POLICY "Users can insert like" 
    ON public.story_likes 
    FOR INSERT 
    WITH CHECK (
        (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
        (auth.uid() IS NULL AND client_id IS NOT NULL)
    );

-- Users / Guests can delete their own like
DROP POLICY IF EXISTS "Users can delete like" ON public.story_likes;
CREATE POLICY "Users can delete like" 
    ON public.story_likes 
    FOR DELETE 
    USING (
        (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
        (auth.uid() IS NULL AND client_id IS NOT NULL)
    );

-- Service role has full access to likes
DROP POLICY IF EXISTS "Service role full access on likes" ON public.story_likes;
CREATE POLICY "Service role full access on likes" 
    ON public.story_likes 
    FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

-- 7. Database Functions (Atomic RPC)

-- Atomic increment for views
CREATE OR REPLACE FUNCTION public.increment_story_views(story_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_views INTEGER;
BEGIN
    UPDATE public.stories
    SET views = views + 1,
        updated_at = now()
    WHERE id = story_id
    RETURNING views INTO new_views;
    
    RETURN COALESCE(new_views, 0);
END;
$$;

-- Atomic like toggle
CREATE OR REPLACE FUNCTION public.toggle_story_like(
    p_story_id UUID, 
    p_client_id TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_liked BOOLEAN;
    v_likes_count INTEGER;
    v_effective_user_id UUID;
BEGIN
    -- Determine user id from auth if not passed
    v_effective_user_id := COALESCE(p_user_id, auth.uid());

    -- Check if like already exists
    IF v_effective_user_id IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.story_likes 
            WHERE story_id = p_story_id AND user_id = v_effective_user_id
        ) INTO v_liked;
    ELSE
        SELECT EXISTS (
            SELECT 1 FROM public.story_likes 
            WHERE story_id = p_story_id AND client_id = p_client_id
        ) INTO v_liked;
    END IF;

    -- Toggle
    IF v_liked THEN
        -- Remove like
        IF v_effective_user_id IS NOT NULL THEN
            DELETE FROM public.story_likes 
            WHERE story_id = p_story_id AND user_id = v_effective_user_id;
        ELSE
            DELETE FROM public.story_likes 
            WHERE story_id = p_story_id AND client_id = p_client_id;
        END IF;

        UPDATE public.stories
        SET likes = GREATEST(likes - 1, 0)
        WHERE id = p_story_id
        RETURNING likes INTO v_likes_count;

        RETURN json_build_object('liked', false, 'likes', COALESCE(v_likes_count, 0));
    ELSE
        -- Add like
        IF v_effective_user_id IS NOT NULL THEN
            INSERT INTO public.story_likes (story_id, user_id, client_id)
            VALUES (p_story_id, v_effective_user_id, p_client_id)
            ON CONFLICT (story_id, user_id) DO NOTHING;
        ELSE
            INSERT INTO public.story_likes (story_id, client_id)
            VALUES (p_story_id, p_client_id)
            ON CONFLICT (story_id, client_id) DO NOTHING;
        END IF;

        UPDATE public.stories
        SET likes = likes + 1
        WHERE id = p_story_id
        RETURNING likes INTO v_likes_count;

        RETURN json_build_object('liked', true, 'likes', COALESCE(v_likes_count, 0));
    END IF;
END;
$$;

-- 8. Storage Setup for Story Covers
-- Note: In Supabase, the storage bucket can be created via SQL or Dashboard
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'story-covers', 
    'story-covers', 
    true, 
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
ON CONFLICT (id) DO UPDATE 
SET public = true;

-- Storage RLS: Public read access
DROP POLICY IF EXISTS "Public Access story-covers" ON storage.objects;
CREATE POLICY "Public Access story-covers"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'story-covers');

-- Storage RLS: Service role and authenticated upload
DROP POLICY IF EXISTS "Service role upload story-covers" ON storage.objects;
CREATE POLICY "Service role upload story-covers"
    ON storage.objects FOR ALL
    TO service_role
    USING (bucket_id = 'story-covers')
    WITH CHECK (bucket_id = 'story-covers');
