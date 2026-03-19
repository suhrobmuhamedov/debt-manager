import { Telegraf } from 'telegraf';
import * as dotenv from 'dotenv';
import { startCommand } from './commands/start';
import { helpCommand } from './commands/help';
import { balanceCommand } from './commands/balance';

dotenv.config();

const botToken = process.env.BOT_TOKEN;
if (!botToken) {
  throw new Error('BOT_TOKEN must be set in environment');
}

const bot = new Telegraf(botToken);

// Commands
bot.start(startCommand);
bot.help(helpCommand);
bot.command('balance', balanceCommand);

// Error handling
bot.catch((err, ctx) => {
  console.error(`Bot error for ${ctx.updateType}:`, err);
});

// Start bot
bot.launch()
  .then(() => {
    console.log('🤖 Bot started successfully!');
  })
  .catch((err) => {
    console.error('Failed to start bot:', err);
  });

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));