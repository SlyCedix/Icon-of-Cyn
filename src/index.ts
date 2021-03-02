import { bot } from './util/bot';

bot.init();
bot.on('ready', () => bot.run());