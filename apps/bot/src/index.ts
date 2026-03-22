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
let isLaunching = false;

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
  await ctx.editMessageText(helpText);
  await ctx.answerCbQuery();
});

// Error handling
bot.catch((err: any) => {
  console.error('Bot error:', err);
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isTelegramConflictError = (err: any) => {
  return err?.response?.error_code === 409 && err?.on?.method === 'getUpdates';
};

async function launchBotWithRetry() {
  if (isLaunching) return;
  isLaunching = true;

  while (true) {
    try {
      // Ensure we are in long-polling mode and no stale webhook blocks updates.
      await bot.telegram.deleteWebhook({ drop_pending_updates: true });
      await bot.launch({ dropPendingUpdates: true });
      console.log('Bot ishga tushdi!');
      break;
    } catch (err: any) {
      const errorCode = err?.response?.error_code;
      if (errorCode === 409) {
        console.warn('Telegram 409 conflict: boshqa instance getUpdates ishlatyapti. 5 soniyada qayta urinamiz...');
        await sleep(5000);
        continue;
      }

      console.error('Bot launch xatosi:', err);
      isLaunching = false;
      throw err;
    }
  }

  isLaunching = false;
}

void launchBotWithRetry();

const restartPollingAfterConflict = async () => {
  try {
    bot.stop('409_CONFLICT');
  } catch {
    // ignore stop errors
  }

  await sleep(5000);
  void launchBotWithRetry();
};

process.on('unhandledRejection', (reason: any) => {
  if (isTelegramConflictError(reason)) {
    console.warn('Unhandled Telegram 409 conflict ushlandi. Polling qayta ishga tushiriladi...');
    void restartPollingAfterConflict();
    return;
  }

  console.error('Unhandled rejection:', reason);
});

process.on('uncaughtException', (err: any) => {
  if (isTelegramConflictError(err)) {
    console.warn('Uncaught Telegram 409 conflict ushlandi. Polling qayta ishga tushiriladi...');
    void restartPollingAfterConflict();
    return;
  }

  console.error('Uncaught exception:', err);
  process.exit(1);
});

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
