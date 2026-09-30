import { Markup } from 'telegraf';
import { escapeHtml } from '../utils/helpers.js';
import { getDashboardStats } from '../supabase.js';

export async function handleStats(ctx) {
  try {
    const stats = await getDashboardStats();

    let topStoriesText = 'None yet.';
    if (stats.topStories.length > 0) {
      topStoriesText = stats.topStories
        .map((s, idx) => `${idx + 1}. <b>${escapeHtml(s.title)}</b> — ${s.views} views, ${s.likes} likes`)
        .join('\n');
    }

    const text = 
      `📊 <b>Platform Engagement & Analytics:</b>\n\n` +
      `📖 <b>Total Stories:</b> ${stats.totalStories}\n` +
      `🟢 <b>Published:</b> ${stats.publishedStories}\n` +
      `🟡 <b>Drafts:</b> ${stats.draftStories}\n\n` +
      `👁️ <b>Total Story Views:</b> ${stats.totalViews.toLocaleString()}\n` +
      `❤️ <b>Total Reader Likes:</b> ${stats.totalLikes.toLocaleString()}\n\n` +
      `🏆 <b>Top Stories:</b>\n${topStoriesText}`;

    const menu = Markup.inlineKeyboard([
      [Markup.button.callback('🔄 Refresh Stats', 'action_stats')],
      [
        Markup.button.callback('📚 View Stories', 'action_list_stories'),
        Markup.button.callback('🔙 Main Menu', 'action_main_menu'),
      ],
    ]);

    if (ctx.callbackQuery) {
      await ctx.editMessageText(text, { parse_mode: 'HTML', ...menu }).catch(() => {
        return ctx.reply(text, { parse_mode: 'HTML', ...menu });
      });
    } else {
      await ctx.reply(text, { parse_mode: 'HTML', ...menu });
    }
  } catch (err) {
    console.error('Error fetching stats:', err);
    await ctx.reply(`❌ Failed to retrieve stats: ${err.message}`);
  }
}
