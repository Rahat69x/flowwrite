# Editorial Short Story Reading Platform

A modern, full-stack story reading platform built for real-time editorial publishing:
- **Frontend**: Clean, mainstream editorial web application hosted on **Vercel** with a 100% full-width layout (no artificial 70% width box, no gradient/template AI slop).
- **Backend**: Telegram Admin Bot hosted on **Render** for publishing stories with cover images, editing, managing, and deleting stories directly via Telegram.
- **Database & Storage**: **Supabase** (PostgreSQL with RLS, atomic RPC functions for views and likes, and Supabase Storage for cover artwork).
- **Authentication**: Native Supabase basic email sign-in / sign-up / magic link.
- **Data Policy**: 100% live data — zero fake mock data or seeds.

---

## Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │             TELEGRAM APP               │
                      │    (Admin publishes & edits stories)   │
                      └──────────────────┬─────────────────────┘
                                         │
                                         ▼
                      ┌────────────────────────────────────────┐
                      │         RENDER BACKEND BOT             │
                      │  (Node.js + Telegraf + Express Health) │
                      └──────────────────┬─────────────────────┘
                                         │
               Direct Photo Upload       │ Database CRUD
                                         ▼
                      ┌────────────────────────────────────────┐
                      │           SUPABASE PROJECT             │
                      │  • PostgreSQL Database ('stories')     │
                      │  • Storage Bucket ('story-covers')     │
                      │  • Supabase Auth (Email Login)         │
                      └──────────────────┬─────────────────────┘
                                         │
                               Real Data │ Live Queries
                                         ▼
                      ┌────────────────────────────────────────┐
                      │            VERCEL FRONTEND             │
                      │    • 100% Full-Width Layout            │
                      │    • Reader: Views, Likes, Typography  │
                      │    • Basic Email Authentication        │
                      └────────────────────────────────────────┘
```

---

## 1. Supabase Database & Storage Setup

1. Open your [Supabase Dashboard](https://database.new) and create or open your project.
2. Go to the **SQL Editor** tab.
3. Open [`supabase/schema.sql`](file:///v:/Mahdi/test_bot/supabase/schema.sql), copy its contents, paste it into the SQL Editor, and click **Run**.
4. The migration script will automatically create:
   - `public.stories` table
   - `public.story_likes` table
   - Row Level Security (RLS) policies
   - Atomic RPC functions `increment_story_views` and `toggle_story_like`
   - Public Supabase Storage bucket `story-covers`
5. Go to **Project Settings -> API** and copy:
   - **Project URL**
   - **anon / public key** (for Frontend)
   - **service_role secret key** (for Telegram Bot on Render)

---

## 2. Backend Telegram Bot Setup & Deployment to Render

The bot allows authorized administrators to add new stories with photo uploads, edit past stories, change categories, toggle draft/publish, view analytics, and delete stories.

### Local Development:
```bash
cd bot
cp .env.example .env
# Edit .env with your BOT_TOKEN, ADMIN_TELEGRAM_IDS, and SUPABASE credentials
npm install
npm start
```

### Free Render Deployment:
1. Push your repository to GitHub.
2. In [Render Dashboard](https://dashboard.render.com), click **New +** -> **Web Service**.
3. Select your repository.
4. Set configuration:
   - **Name**: `story-telegram-bot`
   - **Root Directory**: `bot`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/index.js`
   - **Plan**: `Free`
5. Add Environment Variables in Render:
   - `BOT_TOKEN`: Telegram bot token from [@BotFather](https://t.me/BotFather)
   - `ADMIN_TELEGRAM_IDS`: Your Telegram user ID (comma-separated if multiple admins)
   - `SUPABASE_URL`: Your Supabase Project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase `service_role` secret key
   - `FRONTEND_URL`: Your live Vercel URL (e.g., `https://your-stories.vercel.app`)
   - `PORT`: `10000` (Render's internal port)
6. Click **Create Web Service**.

> The bot includes an Express health check endpoint (`GET /health`) on `PORT` so Render's free tier keeps it online reliably.

---

## 3. Frontend Web App Setup & Deployment to Vercel

The frontend is an editorial short story reading application with a 100% full-width layout, clean mainstream styling, email login, and reader controls.

### Local Development:
```bash
cd frontend
cp .env.example .env
# Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

### Vercel Deployment:
1. Push your code to GitHub.
2. In [Vercel Dashboard](https://vercel.com), click **Add New** -> **Project**.
3. Import your repository.
4. Set **Root Directory** to `frontend`.
5. Add Environment Variables in Vercel:
   - `VITE_SUPABASE_URL`: Your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase `anon` public key
6. Click **Deploy**.

---

## 4. Bot Admin Guide

Send `/start` to your Telegram bot. If your Telegram ID is in `ADMIN_TELEGRAM_IDS`, you will see the interactive control panel:
- `➕ New Story`: Start wizard to add Title, Category, Excerpt, Content, and upload Cover Image.
- `📚 Manage Stories`: Interactive paginated list to edit any story's Title, Content, Excerpt, Category, Cover, toggle Draft/Publish, or delete.
- `📊 Platform Analytics`: Real-time reader stats (total stories, views, likes).
