import {Bot} from './util/bot';
import config from './config.json';
import { prepareDB } from './util/database';

const bot = new Bot(config.token);

// prepareDB();


bot.init();
bot.on('ready', () => bot.run());