import { Scenes, Markup } from 'telegraf';
import { generateSlug } from '../utils/slug.js';
import { calculateReadingTime, escapeHtml, truncate } from '../utils/helpers.js';
import { downloadTelegramFile, uploadCoverImage, insertStory } from '../supabase.js';
import { config } from '../config.js';

export const ADD_STORY_SCENE_ID = 'ADD_STORY_SCENE';

const CATEGORIES = ['Fiction', 'Non-Fiction', 'Mystery', 'Sci-Fi', 'Drama', 'Essay', 'Poetry'];

export const addStoryWizard = new Scenes.WizardScene(
  ADD_STORY_SCENE_ID,

  // Step 1: Request Title
  async (ctx) => {
    ctx.scene.session.storyData = {};
    await ctx.reply(
      '📖 <b>Step 1 of 5: Story Title</b>\n\nPlease enter the title of your new story:\n\n<i>(Send /cancel at any time to abort)</i>',
      {
        parse_mode: 'HTML',
        ...Markup.keyboard([['❌ Cancel']]).resize(),
      }
    );
    return ctx.wizard.next();
  },

  // Step 2: Receive Title, Request Category
  async (ctx) => {
    if (ctx.message?.text === '❌ Cancel' || ctx.message?.text === '/cancel') {
      await ctx.reply('Story creation cancelled.', Markup.removeKeyboard());
      return ctx.scene.leave();
    }

    const title = ctx.message?.text?.trim();
    if (!title || title.length < 2) {
      await ctx.reply('⚠️ Please provide a valid story title (at least 2 characters):');
      return;
    }

    ctx.scene.session.storyData.title = title;

    // Show category buttons
    const buttons = CATEGORIES.map((cat) => [Markup.button.callback(cat, `cat_${cat}`)]);
    await ctx.reply(
      `Selected Title: <b>${escapeHtml(title)}</b>\n\n🏷️ <b>Step 2 of 5: Choose Category</b>\nSelect one below or type your own custom category:`,
      {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard(buttons),
      }
    );
    return ctx.wizard.next();
  },

  // Step 3: Receive Category, Request Excerpt / Summary
  async (ctx) => {
    let category = 'Fiction';

    if (ctx.callbackQuery) {
      const data = ctx.callbackQuery.data;
      if (data.startsWith('cat_')) {
        category = data.replace('cat_', '');
        await ctx.answerCbQuery(`Selected: ${category}`);
      }
    } else if (ctx.message?.text) {
      if (ctx.message.text === '❌ Cancel' || ctx.message.text === '/cancel') {
        await ctx.reply('Story creation cancelled.', Markup.removeKeyboard());
        return ctx.scene.leave();
      }
      category = ctx.message.text.trim();
    }

    ctx.scene.session.storyData.category = category;

    await ctx.reply(
      `Category set to: <b>${escapeHtml(category)}</b>\n\n📝 <b>Step 3 of 5: Short Excerpt / Summary</b>\nSend a 1-2 sentence hook for readers, or click <b>"Auto-generate from Content"</b>:`,
      {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('⚡ Auto-generate from Story', 'skip_excerpt')],
        ]),
      }
    );
    return ctx.wizard.next();
  },

  // Step 4: Receive Excerpt, Request Story Content
  async (ctx) => {
    let excerpt = '';

    if (ctx.callbackQuery && ctx.callbackQuery.data === 'skip_excerpt') {
      await ctx.answerCbQuery('Will auto-generate excerpt from story text.');
      ctx.scene.session.storyData.autoExcerpt = true;
    } else if (ctx.message?.text) {
      if (ctx.message.text === '❌ Cancel' || ctx.message.text === '/cancel') {
        await ctx.reply('Story creation cancelled.', Markup.removeKeyboard());
        return ctx.scene.leave();
      }
      excerpt = ctx.message.text.trim();
      ctx.scene.session.storyData.excerpt = excerpt;
    }

    await ctx.reply(
      '📜 <b>Step 4 of 5: Story Content</b>\n\n' +
      'Please paste or write the full text of your story now.\n' +
      'You can use normal paragraphs, dialogue, and formatting.',
      {
        parse_mode: 'HTML',
        ...Markup.keyboard([['❌ Cancel']]).resize(),
      }
    );
    return ctx.wizard.next();
  },

  // Step 5: Receive Content, Request Cover Image
  async (ctx) => {
    if (ctx.message?.text === '❌ Cancel' || ctx.message?.text === '/cancel') {
      await ctx.reply('Story creation cancelled.', Markup.removeKeyboard());
      return ctx.scene.leave();
    }

    const content = ctx.message?.text?.trim();
    if (!content || content.length < 20) {
      await ctx.reply('⚠️ The story content is too short. Please send the full story text:');
      return;
    }

    ctx.scene.session.storyData.content = content;

    // If excerpt was not manually provided, generate from content
    if (!ctx.scene.session.storyData.excerpt) {
      ctx.scene.session.storyData.excerpt = truncate(content.replace(/\n+/g, ' '), 180);
    }

    ctx.scene.session.storyData.readingTime = calculateReadingTime(content);

    await ctx.reply(
      '🖼️ <b>Step 5 of 5: Cover Image</b>\n\n' +
      '• <b>Upload a photo</b> directly right here in Telegram,\n' +
      '• Or send an image <b>URL</b> (https://...),\n' +
      '• Or click <b>"Default Editorial Cover"</b> below to proceed without uploading.',
      {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('✨ Use Default Editorial Cover', 'skip_image')],
        ]),
      }
    );
    return ctx.wizard.next();
  },

  // Step 6: Receive Cover, Final Confirmation
  async (ctx) => {
    let coverUrl = null;

    if (ctx.callbackQuery && ctx.callbackQuery.data === 'skip_image') {
      await ctx.answerCbQuery('Using default editorial cover image.');
      coverUrl = 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1600&q=80';
    } else if (ctx.message?.photo) {
      const statusMsg = await ctx.reply('⏳ Uploading your photo to Supabase Storage...');
      try {
        const photos = ctx.message.photo;
        const highestRes = photos[photos.length - 1];
        const fileLink = await ctx.telegram.getFileLink(highestRes.file_id);
        const fileBuffer = await downloadTelegramFile(fileLink.href);

        coverUrl = await uploadCoverImage(fileBuffer, 'jpg', 'image/jpeg');
        await ctx.telegram.deleteMessage(ctx.chat.id, statusMsg.message_id).catch(() => {});
      } catch (err) {
        console.error('Failed to upload photo:', err);
        await ctx.reply('⚠️ Failed to upload photo to storage. Using fallback editorial image.');
        coverUrl = 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1600&q=80';
      }
    } else if (ctx.message?.text) {
      if (ctx.message.text === '❌ Cancel' || ctx.message.text === '/cancel') {
        await ctx.reply('Story creation cancelled.', Markup.removeKeyboard());
        return ctx.scene.leave();
      }
      const text = ctx.message.text.trim();
      if (text.startsWith('http://') || text.startsWith('https://')) {
        coverUrl = text;
      } else {
        await ctx.reply('⚠️ Please send a photo, an image URL (https://...), or click "Use Default Editorial Cover":');
        return;
      }
    } else {
      await ctx.reply('⚠️ Please send an image or select "Use Default Editorial Cover":');
      return;
    }

    ctx.scene.session.storyData.coverImageUrl = coverUrl;

    const data = ctx.scene.session.storyData;
    const authorName = ctx.from?.first_name 
      ? `${ctx.from.first_name}${ctx.from.last_name ? ' ' + ctx.from.last_name : ''}`
      : 'Editorial Desk';
    data.authorName = authorName;

    // Send summary preview card
    const previewMessage = 
      `🎉 <b>Ready to Publish! Review Details:</b>\n\n` +
      `📌 <b>Title:</b> ${escapeHtml(data.title)}\n` +
      `🏷️ <b>Category:</b> ${escapeHtml(data.category)}\n` +
      `✍️ <b>Author:</b> ${escapeHtml(authorName)}\n` +
      `⏱️ <b>Est. Read Time:</b> ${data.readingTime} min\n` +
      `📝 <b>Excerpt:</b>\n<i>"${escapeHtml(data.excerpt)}"</i>\n\n` +
      `Choose how you would like to save:`;

    const actionButtons = Markup.inlineKeyboard([
      [
        Markup.button.callback('🚀 Publish Immediately', 'save_published'),
        Markup.button.callback('📝 Save as Draft', 'save_draft'),
      ],
      [Markup.button.callback('❌ Discard', 'save_discard')],
    ]);

    if (coverUrl) {
      await ctx.replyWithPhoto(coverUrl, {
        caption: previewMessage,
        parse_mode: 'HTML',
        ...actionButtons,
      });
    } else {
      await ctx.reply(previewMessage, {
        parse_mode: 'HTML',
        ...actionButtons,
      });
    }

    return ctx.wizard.next();
  },

  // Step 7: Handle final save action
  async (ctx) => {
    if (!ctx.callbackQuery) {
      if (ctx.message?.text === '❌ Cancel' || ctx.message?.text === '/cancel') {
        await ctx.reply('Story creation cancelled.', Markup.removeKeyboard());
        return ctx.scene.leave();
      }
      await ctx.reply('Please choose an action using the buttons above.');
      return;
    }

    const action = ctx.callbackQuery.data;
    const data = ctx.scene.session.storyData;

    if (action === 'save_discard') {
      await ctx.answerCbQuery('Story discarded');
      await ctx.reply('Story creation was discarded.', Markup.removeKeyboard());
      return ctx.scene.leave();
    }

    const isPublished = action === 'save_published';
    await ctx.answerCbQuery(isPublished ? 'Publishing...' : 'Saving draft...');

    try {
      const slug = generateSlug(data.title);
      const storyPayload = {
        title: data.title,
        slug,
        category: data.category,
        content: data.content,
        excerpt: data.excerpt,
        cover_image_url: data.coverImageUrl,
        author_name: data.authorName || 'Editorial Desk',
        reading_time_minutes: data.readingTime || 3,
        is_published: isPublished,
        telegram_message_id: ctx.callbackQuery.message?.message_id,
      };

      const newStory = await insertStory(storyPayload);

      const frontendStoryUrl = `${config.frontendUrl}/#story-${newStory.slug}`;

      await ctx.reply(
        `✅ <b>Story successfully ${isPublished ? 'Published' : 'Saved as Draft'}!</b>\n\n` +
        `📖 <b>Title:</b> ${escapeHtml(newStory.title)}\n` +
        `🏷️ <b>Category:</b> ${escapeHtml(newStory.category)}\n` +
        `🔗 <b>Slug:</b> <code>${newStory.slug}</code>\n` +
        `🌐 <b>Live Web URL:</b> <a href="${frontendStoryUrl}">${frontendStoryUrl}</a>`,
        {
          parse_mode: 'HTML',
          ...Markup.removeKeyboard(),
          ...Markup.inlineKeyboard([
            [Markup.button.url('🌐 Open on Website', frontendStoryUrl)],
            [Markup.button.callback('📚 Return to Stories List', 'nav_stories')],
          ]),
        }
      );
    } catch (err) {
      console.error('Error saving story to database:', err);
      await ctx.reply(
        `❌ <b>Error saving story:</b> ${escapeHtml(err.message || 'Unknown database error')}\n\nPlease check your database connection.`,
        { parse_mode: 'HTML', ...Markup.removeKeyboard() }
      );
    }

    return ctx.scene.leave();
  }
);
