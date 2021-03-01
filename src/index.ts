import {Bot} from './util/bot';
import config from './config.json';

const bot = new Bot(config.token);

bot.init();
bot.on('ready', () => bot.run());