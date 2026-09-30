import { config } from '../config.js';

/**
 * Check if the user is an authorized admin
 */
export function isAdmin(userId) {
  if (!config.adminIds || config.adminIds.length === 0) {
    return false;
  }
  return config.adminIds.includes(Number(userId));
}

/**
 * Telegraf middleware to restrict access to admins
 */
export function adminOnly(ctx, next) {
  const userId = ctx.from?.id;

  if (!userId) {
    return ctx.reply('⚠️ Unable to verify your user identity.');
  }

  if (!isAdmin(userId)) {
    return ctx.reply(
      `🔒 <b>Access Restricted</b>\n\n` +
      `You are not authorized to manage stories on this bot.\n\n` +
      `Your Telegram ID is: <code>${userId}</code>\n\n` +
      `To gain access, add this ID to your <code>ADMIN_TELEGRAM_IDS</code> in the <code>.env</code> file or Render environment variables.`,
      { parse_mode: 'HTML' }
    );
  }

  return next();
}
