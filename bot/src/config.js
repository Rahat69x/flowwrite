import dotenv from 'dotenv';
dotenv.config();

export const config = {
  botToken: process.env.BOT_TOKEN || '',
  adminIds: (process.env.ADMIN_TELEGRAM_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
    .map((id) => Number(id)),
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '',
  frontendUrl: (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, ''),
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
};

export function validateConfig() {
  const missing = [];
  if (!config.botToken) missing.push('BOT_TOKEN');
  if (!config.supabaseUrl) missing.push('SUPABASE_URL');
  if (!config.supabaseKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');

  if (missing.length > 0) {
    console.warn(`[WARN] Missing required environment variables: ${missing.join(', ')}`);
    console.warn('[WARN] Please configure them in your .env file or Render environment variables.');
  }

  if (config.adminIds.length === 0) {
    console.warn('[WARN] ADMIN_TELEGRAM_IDS is empty. All users will be blocked from admin actions.');
  }
}
