import { Context } from 'telegraf';
import { helpText } from '../utils/keyboards';

export async function helpCommand(ctx: Context) {
  await ctx.reply(helpText);
}
