import { Scenes, Markup } from 'telegraf';
import { escapeHtml, calculateReadingTime, truncate } from '../utils/helpers.js';
import { fetchStoryById, updateStory, deleteStory, uploadCoverImage, downloadTelegramFile } from '../supabase.js';

export const EDIT_STORY_SCENE_ID = 'EDIT_STORY_SCENE';

export const editStoryWizard = new Scenes.WizardScene(
  EDIT_STORY_SCENE_ID,

  // Step 1: Prompt for field to edit
  async (ctx) => {
    const storyId = ctx.scene.session.targetStoryId;
    if (!storyId) {
      await ctx.reply('⚠️ No story selected for editing.');
      return ctx.scene.leave();
    }

    try {
      const story = await fetchStoryById(storyId);
      ctx.scene.session.currentStory = story;

      const editMenu = Markup.inlineKeyboard([
        [
          Markup.button.callback('✏️ Edit Title', 'edit_field_title'),
          Markup.button.callback('📝 Edit Excerpt', 'edit_field_excerpt'),
        ],
        [
          Markup.button.callback('📜 Edit Content', 'edit_field_content'),
          Markup.button.callback('🏷️ Edit Category', 'edit_field_category'),
        ],
        [
          Markup.button.callback('🖼️ Change Cover Photo', 'edit_field_cover'),
          Markup.button.callback(story.is_published ? '🔒 Switch to Draft' : '🚀 Publish Story', 'toggle_publish'),
        ],
        [
          Markup.button.callback('🗑️ Delete Story', 'confirm_delete'),
          Markup.button.callback('🔙 Done / Back', 'edit_done'),
        ],
      ]);

      const statusBadge = story.is_published ? '🟢 Published' : '🟡 Draft';
      const text = 
        `🛠️ <b>Editing Story:</b> <i>${escapeHtml(story.title)}</i>\n\n` +
        `• <b>Status:</b> ${statusBadge}\n` +
        `• <b>Category:</b> ${escapeHtml(story.category)}\n` +
        `• <b>Read Time:</b> ${story.reading_time_minutes} min\n` +
        `• <b>Views:</b> ${story.views} | <b>Likes:</b> ${story.likes}\n\n` +
        `Select which property you want to update:`;

      if (ctx.callbackQuery) {
        await ctx.editMessageText(text, { parse_mode: 'HTML', ...editMenu }).catch(() => {
          return ctx.reply(text, { parse_mode: 'HTML', ...editMenu });
        });
      } else {
        await ctx.reply(text, { parse_mode: 'HTML', ...editMenu });
      }

      return ctx.wizard.next();
    } catch (err) {
      console.error('Error fetching story:', err);
      await ctx.reply('⚠️ Failed to load story details.');
      return ctx.scene.leave();
    }
  },

  // Step 2: Handle user choice and prompt for new value
  async (ctx) => {
    if (!ctx.callbackQuery) {
      if (ctx.message?.text === '/cancel') {
        await ctx.reply('Editing cancelled.');
        return ctx.scene.leave();
      }
      return;
    }

    const action = ctx.callbackQuery.data;
    const story = ctx.scene.session.currentStory;

    if (action === 'edit_done') {
      await ctx.answerCbQuery('Done editing');
      await ctx.reply('✅ Finished editing story.');
      return ctx.scene.leave();
    }

    if (action === 'toggle_publish') {
      const newStatus = !story.is_published;
      await updateStory(story.id, { is_published: newStatus });
      await ctx.answerCbQuery(newStatus ? 'Published!' : 'Set to Draft');
      ctx.scene.session.currentStory.is_published = newStatus;
      ctx.wizard.selectStep(0);
      return ctx.wizard.steps[0](ctx);
    }

    if (action === 'confirm_delete') {
      await ctx.answerCbQuery();
      await ctx.reply(
        `⚠️ <b>Delete Confirmation</b>\n\nAre you sure you want to permanently delete:\n<b>"${escapeHtml(story.title)}"</b>?\n\nThis cannot be undone!`,
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            [
              Markup.button.callback('🗑️ Yes, Delete Permanently', 'execute_delete'),
              Markup.button.callback('❌ No, Cancel', 'cancel_delete'),
            ],
          ]),
        }
      );
      return ctx.wizard.next();
    }

    ctx.scene.session.editingField = action.replace('edit_field_', '');

    switch (ctx.scene.session.editingField) {
      case 'title':
        await ctx.answerCbQuery();
        await ctx.reply(
          `Current Title: <b>${escapeHtml(story.title)}</b>\n\nSend the new title:`,
          { parse_mode: 'HTML', ...Markup.keyboard([['❌ Cancel']]).resize() }
        );
        return ctx.wizard.next();

      case 'excerpt':
        await ctx.answerCbQuery();
        await ctx.reply(
          `Current Excerpt: <i>"${escapeHtml(story.excerpt || 'None')}"</i>\n\nSend the new excerpt (1-2 sentences):`,
          { parse_mode: 'HTML', ...Markup.keyboard([['❌ Cancel']]).resize() }
        );
        return ctx.wizard.next();

      case 'content':
        await ctx.answerCbQuery();
        await ctx.reply(
          `Send the new full story text:\n\n<i>(Tip: Paste your full revised text)</i>`,
          { parse_mode: 'HTML', ...Markup.keyboard([['❌ Cancel']]).resize() }
        );
        return ctx.wizard.next();

      case 'category':
        await ctx.answerCbQuery();
        const cats = ['Fiction', 'Non-Fiction', 'Mystery', 'Sci-Fi', 'Drama', 'Essay', 'Poetry'];
        await ctx.reply(
          `Current Category: <b>${escapeHtml(story.category)}</b>\n\nChoose a new category or type one:`,
          {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard(cats.map((c) => [Markup.button.callback(c, `newcat_${c}`)])),
          }
        );
        return ctx.wizard.next();

      case 'cover':
        await ctx.answerCbQuery();
        await ctx.reply(
          `🖼️ <b>Upload New Cover Photo:</b>\n\nSend a photo directly in Telegram or send an image URL (https://...):`,
          { parse_mode: 'HTML', ...Markup.keyboard([['❌ Cancel']]).resize() }
        );
        return ctx.wizard.next();

      default:
        await ctx.answerCbQuery('Unknown action');
        return ctx.scene.leave();
    }
  },

  // Step 3: Receive new value and update database
  async (ctx) => {
    const story = ctx.scene.session.currentStory;
    const field = ctx.scene.session.editingField;

    // Handle delete action
    if (ctx.callbackQuery) {
      if (ctx.callbackQuery.data === 'execute_delete') {
        await ctx.answerCbQuery('Deleting...');
        await deleteStory(story.id);
        await ctx.reply(`🗑️ Story <b>"${escapeHtml(story.title)}"</b> has been deleted.`, {
          parse_mode: 'HTML',
          ...Markup.removeKeyboard(),
        });
        return ctx.scene.leave();
      }
      if (ctx.callbackQuery.data === 'cancel_delete') {
        await ctx.answerCbQuery('Cancelled');
        ctx.wizard.selectStep(0);
        return ctx.wizard.steps[0](ctx);
      }
      if (ctx.callbackQuery.data.startsWith('newcat_')) {
        const newCategory = ctx.callbackQuery.data.replace('newcat_', '');
        await updateStory(story.id, { category: newCategory });
        await ctx.answerCbQuery('Category updated!');
        await ctx.reply(`✅ Category changed to <b>${escapeHtml(newCategory)}</b>.`, { parse_mode: 'HTML' });
        ctx.wizard.selectStep(0);
        return ctx.wizard.steps[0](ctx);
      }
    }

    if (ctx.message?.text === '❌ Cancel' || ctx.message?.text === '/cancel') {
      await ctx.reply('Edit cancelled.', Markup.removeKeyboard());
      ctx.wizard.selectStep(0);
      return ctx.wizard.steps[0](ctx);
    }

    try {
      if (field === 'title') {
        const newTitle = ctx.message.text.trim();
        await updateStory(story.id, { title: newTitle });
        await ctx.reply(`✅ Title updated to: <b>${escapeHtml(newTitle)}</b>`, {
          parse_mode: 'HTML',
          ...Markup.removeKeyboard(),
        });
      } else if (field === 'excerpt') {
        const newExcerpt = ctx.message.text.trim();
        await updateStory(story.id, { excerpt: newExcerpt });
        await ctx.reply(`✅ Excerpt updated successfully.`, {
          parse_mode: 'HTML',
          ...Markup.removeKeyboard(),
        });
      } else if (field === 'content') {
        const newContent = ctx.message.text.trim();
        const readingTime = calculateReadingTime(newContent);
        await updateStory(story.id, { content: newContent, reading_time_minutes: readingTime });
        await ctx.reply(`✅ Story content and read time updated (${readingTime} min).`, {
          parse_mode: 'HTML',
          ...Markup.removeKeyboard(),
        });
      } else if (field === 'category') {
        const newCat = ctx.message.text.trim();
        await updateStory(story.id, { category: newCat });
        await ctx.reply(`✅ Category updated to <b>${escapeHtml(newCat)}</b>.`, {
          parse_mode: 'HTML',
          ...Markup.removeKeyboard(),
        });
      } else if (field === 'cover') {
        let newCoverUrl = null;
        if (ctx.message.photo) {
          const statusMsg = await ctx.reply('⏳ Uploading new cover photo to Supabase...');
          const photos = ctx.message.photo;
          const highestRes = photos[photos.length - 1];
          const fileLink = await ctx.telegram.getFileLink(highestRes.file_id);
          const fileBuffer = await downloadTelegramFile(fileLink.href);

          newCoverUrl = await uploadCoverImage(fileBuffer, 'jpg', 'image/jpeg');
          await ctx.telegram.deleteMessage(ctx.chat.id, statusMsg.message_id).catch(() => {});
        } else if (ctx.message.text?.startsWith('http')) {
          newCoverUrl = ctx.message.text.trim();
        } else {
          await ctx.reply('⚠️ Please send a valid photo or image URL.');
          return;
        }

        await updateStory(story.id, { cover_image_url: newCoverUrl });
        await ctx.reply('✅ Cover image updated successfully!', Markup.removeKeyboard());
      }
    } catch (err) {
      console.error('Error updating story:', err);
      await ctx.reply(`❌ Failed to update story: ${err.message}`, Markup.removeKeyboard());
    }

    // Refresh back to menu
    ctx.wizard.selectStep(0);
    return ctx.wizard.steps[0](ctx);
  }
);
