import WebSocket from 'ws';
if (!globalThis.WebSocket) {
  globalThis.WebSocket = WebSocket;
}

import { Telegraf, Scenes, session } from 'telegraf';
import express from 'express';
import { config, validateConfig } from './config.js';
import { adminOnly } from './middleware/auth.js';
import { addStoryWizard, ADD_STORY_SCENE_ID } from './scenes/addStory.js';
import { editStoryWizard, EDIT_STORY_SCENE_ID } from './scenes/editStory.js';
import { handleStart } from './handlers/start.js';
import { handleListStories } from './handlers/stories.js';
import { handleStats } from './handlers/stats.js';

validateConfig();

// 1. Initialize Express app for Render Health Checks
const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Story Platform Telegram Admin Bot',
    frontend: config.frontendUrl,
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Start HTTP server on Render's required PORT
const server = app.listen(config.port, '0.0.0.0', () => {
  console.log(`[HTTP] Healthcheck server listening on port ${config.port}`);
});

// 2. Initialize Telegraf Bot
if (!config.botToken) {
  console.error('[ERROR] BOT_TOKEN is missing. Bot cannot start.');
  process.exit(1);
}

const bot = new Telegraf(config.botToken);

// Setup Scenes Stage
const stage = new Scenes.Stage([addStoryWizard, editStoryWizard]);

bot.use(session());
bot.use(stage.middleware());

// Enforce admin permission on all commands
bot.use(adminOnly);

// Top level commands
bot.command('start', handleStart);
bot.command('menu', handleStart);
bot.command('dashboard', handleStart);

bot.command('newstory', async (ctx) => {
  return ctx.scene.enter(ADD_STORY_SCENE_ID);
});

bot.command('stories', async (ctx) => {
  return handleListStories(ctx, 1);
});

bot.command('stats', handleStats);

bot.command('cancel', async (ctx) => {
  if (ctx.scene.current) {
    await ctx.scene.leave();
    await ctx.reply('Action cancelled.', { reply_markup: { remove_keyboard: true } });
  } else {
    await ctx.reply('Nothing to cancel.');
  }
});

// Inline Action Callbacks
bot.action('action_main_menu', async (ctx) => {
  await ctx.answerCbQuery();
  return handleStart(ctx);
});

bot.action('action_new_story', async (ctx) => {
  await ctx.answerCbQuery();
  return ctx.scene.enter(ADD_STORY_SCENE_ID);
});

bot.action('action_list_stories', async (ctx) => {
  await ctx.answerCbQuery();
  return handleListStories(ctx, 1);
});

bot.action('nav_stories', async (ctx) => {
  await ctx.answerCbQuery();
  return handleListStories(ctx, 1);
});

bot.action('action_stats', async (ctx) => {
  await ctx.answerCbQuery();
  return handleStats(ctx);
});

bot.action(/^stories_page_(\d+)$/, async (ctx) => {
  const page = parseInt(ctx.match[1], 10);
  await ctx.answerCbQuery(`Loading page ${page}...`);
  return handleListStories(ctx, page);
});

bot.action(/^story_select_(.+)$/, async (ctx) => {
  const storyId = ctx.match[1];
  await ctx.answerCbQuery();
  return ctx.scene.enter(EDIT_STORY_SCENE_ID, { targetStoryId: storyId });
});

bot.action('noop', async (ctx) => {
  await ctx.answerCbQuery();
});

// Error handling
bot.catch((err, ctx) => {
  console.error(`[Telegraf Error] for ${ctx.updateType}:`, err);
  ctx.reply('⚠️ An unexpected error occurred while processing your request. Please try again.').catch(() => {});
});

// Start bot polling
bot.launch({
  dropPendingUpdates: true,
})
.then(() => {
  console.log('[BOT] Telegram Bot successfully started and listening for commands!');
})
.catch((err) => {
  console.error('[BOT ERROR] Failed to launch bot:', err);
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  bot.stop(signal);
  server.close(() => {
    console.log('[HTTP] Server closed.');
    process.exit(0);
  });
};

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
