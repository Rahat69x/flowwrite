import { Markup } from 'telegraf';
import { escapeHtml, truncate } from '../utils/helpers.js';
import { fetchStories } from '../supabase.js';

export async function handleListStories(ctx, page = 1) {
  try {
    const limit = 5;
    const { stories, totalCount, totalPages, currentPage } = await fetchStories({
      page,
      limit,
      publishedOnly: false,
    });

    if (stories.length === 0) {
      const emptyMenu = Markup.inlineKeyboard([
        [Markup.button.callback('➕ Create First Story', 'action_new_story')],
        [Markup.button.callback('🔙 Main Menu', 'action_main_menu')],
      ]);
      const text = '📚 <b>No stories found in the database.</b>\n\nClick below to create your first story!';
      if (ctx.callbackQuery) {
        return ctx.editMessageText(text, { parse_mode: 'HTML', ...emptyMenu });
      }
      return ctx.reply(text, { parse_mode: 'HTML', ...emptyMenu });
    }

    const buttons = [];

    // Add a button for each story
    for (const story of stories) {
      const statusIcon = story.is_published ? '🟢' : '🟡';
      const label = `${statusIcon} ${truncate(story.title, 32)} (${story.views} 👁️ / ${story.likes} ❤️)`;
      buttons.push([Markup.button.callback(label, `story_select_${story.id}`)]);
    }

    // Pagination row
    const paginationRow = [];
    if (currentPage > 1) {
      paginationRow.push(Markup.button.callback('⬅️ Prev', `stories_page_${currentPage - 1}`));
    }
    paginationRow.push(Markup.button.callback(`Page ${currentPage}/${totalPages}`, 'noop'));
    if (currentPage < totalPages) {
      paginationRow.push(Markup.button.callback('Next ➡️', `stories_page_${currentPage + 1}`));
    }
    buttons.push(paginationRow);

    // Navigation row
    buttons.push([
      Markup.button.callback('➕ Add New Story', 'action_new_story'),
      Markup.button.callback('🔙 Main Menu', 'action_main_menu'),
    ]);

    const header = 
      `📚 <b>All Stories (${totalCount} Total):</b>\n\n` +
      `<i>Click any story below to view, edit title/content/cover, toggle publish, or delete:</i>\n\n` +
      `🟢 = Published | 🟡 = Draft`;

    if (ctx.callbackQuery) {
      await ctx.editMessageText(header, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard(buttons),
      }).catch(async () => {
        await ctx.reply(header, {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard(buttons),
        });
      });
    } else {
      await ctx.reply(header, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard(buttons),
      });
    }
  } catch (err) {
    console.error('Error listing stories:', err);
    await ctx.reply(`❌ Failed to fetch stories: ${err.message}`);
  }
}
