import { Telegraf } from 'telegraf';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

// Validate required env variables
const requiredEnvVars = ['BOT_TOKEN', 'WEB_APP_URL', 'INTERNAL_API_KEY'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

import { startCommand } from './commands/start.command';
import { helpCommand } from './commands/help.command';
import { balanceCommand } from './commands/balance.command';
import { helpText } from './utils/keyboards';

const bot = new Telegraf(process.env.BOT_TOKEN!);

// Register commands
bot.start(startCommand);
bot.help(helpCommand);
bot.command('balance', balanceCommand);

// Handle callback queries
bot.action('show_balance', async (ctx) => {
  await balanceCommand(ctx);
  await ctx.answerCbQuery();
});

bot.action('show_help', async (ctx) => {
  await ctx.editMessageText(helpText, { parse_mode: 'Markdown' });
  await ctx.answerCbQuery();
});

// Error handling
bot.catch((err: any) => {
  console.error('Bot error:', err);
});

// Launch bot
bot.launch();
console.log('Bot ishga tushdi!');

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
