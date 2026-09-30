# Telegram Admin Bot (Backend for Story Platform)

This backend service powers the Telegram Bot hosted on **Render**. It allows administrators to publish, edit, manage, and delete stories directly from Telegram, with automatic photo uploads to **Supabase Storage**.

---

## Features

- 🔐 **Admin Access Control**: Only whitelisted Telegram IDs can publish or modify stories.
- ➕ **Add New Story**: Multi-step conversational wizard for Title, Category, Excerpt, Content, and Cover Image.
- 🖼️ **Telegram Photo Upload**: Send a photo directly in Telegram; it is automatically uploaded to the `story-covers` bucket on Supabase Storage.
- ✏️ **Edit Existing Stories**: Interactive menus to update Title, Content, Excerpt, Category, Cover Image, or toggle between Published and Draft.
- 🗑️ **Delete Stories**: Interactive deletion with safe confirmation dialogs.
- 📊 **Real-time Analytics**: Tracks total stories, total views, total likes, and most-read stories.
- 🩺 **Render Healthcheck**: Built-in Express server listening on `PORT` ensures it runs smoothly on **Render Free Web Services** without sleeping or failing health checks.

---

## 1. Quick Setup (Local Development)

### Prerequisites
- Node.js 20+ installed
- A Telegram Bot Token from [@BotFather](https://t.me/BotFather)
- A Supabase Project (run `supabase/schema.sql` first)

### Step 1: Install Dependencies
```bash
cd bot
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Fill in the values:
```env
BOT_TOKEN=your_telegram_bot_token_here
ADMIN_TELEGRAM_IDS=your_telegram_id_here
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_secret
FRONTEND_URL=https://your-story-app.vercel.app
PORT=3000
```

> **How to find your Telegram User ID?**
> Send `/start` to `@userinfobot` on Telegram, or run the bot and send any message—it will reply with your Telegram ID!

### Step 3: Start the Bot
```bash
npm start
```

---

## 2. Deploy to Render

### Option A: Via GitHub & Render Web Service (Recommended - 100% Free)
1. Push your repository to GitHub.
2. Go to [Render Dashboard](https://dashboard.render.com).
3. Click **New +** -> **Web Service**.
4. Connect your GitHub repository.
5. Configure the service:
   - **Name**: `story-telegram-bot`
   - **Root Directory**: `bot`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/index.js`
   - **Instance Type**: `Free`
6. Add the **Environment Variables**:
   - `BOT_TOKEN`: Your token from @BotFather
   - `ADMIN_TELEGRAM_IDS`: Your Telegram ID (e.g. `123456789`)
   - `SUPABASE_URL`: Your Supabase Project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase `service_role` key (Found in Supabase: *Project Settings -> API -> Project API keys*)
   - `FRONTEND_URL`: The URL of your Vercel frontend deployment
7. Click **Create Web Service**. Render will deploy the bot and start polling Telegram!

### Option B: Using Render Blueprint (`render.yaml`)
Render will automatically detect `bot/render.yaml` if you choose **New +** -> **Blueprint**.
