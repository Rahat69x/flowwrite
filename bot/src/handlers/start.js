import { Markup } from 'telegraf';
import { escapeHtml } from '../utils/helpers.js';
import { config } from '../config.js';

export async function handleStart(ctx) {
  const firstName = ctx.from?.first_name || 'Admin';

  const menu = Markup.inlineKeyboard([
    [
      Markup.button.callback('➕ New Story', 'action_new_story'),
      Markup.button.callback('📚 Manage Stories', 'action_list_stories'),
    ],
    [
      Markup.button.callback('📊 Platform Analytics', 'action_stats'),
      Markup.button.url('🌐 Open Website', config.frontendUrl),
    ],
  ]);

  const welcomeText = 
    `👋 <b>Welcome back, ${escapeHtml(firstName)}!</b>\n\n` +
    `This is your <b>Editorial Admin Bot</b> for the story reading platform.\n\n` +
    `⚡ <b>Quick Actions:</b>\n` +
    `• <b>New Story</b> — Write and publish a new story with cover image\n` +
    `• <b>Manage Stories</b> — Edit titles, text, re-upload covers, publish/draft, or delete\n` +
    `• <b>Analytics</b> — Check overall readership, views, and likes\n\n` +
    `<i>You can also use commands:</i>\n` +
    `/newstory — Add a new story\n` +
    `/stories — List & manage existing stories\n` +
    `/stats — View reader engagement metrics\n` +
    `/cancel — Abort current operation`;

  if (ctx.callbackQuery) {
    await ctx.editMessageText(welcomeText, { parse_mode: 'HTML', ...menu }).catch(() => {
      return ctx.reply(welcomeText, { parse_mode: 'HTML', ...menu });
    });
  } else {
    await ctx.reply(welcomeText, { parse_mode: 'HTML', ...menu });
  }
}
