import {Bot} from './bot';
import {Database} from './database'
import config from './config.json';

const database = new Database(config.mongoString);
const bot = new Bot(config.token, database);

database.restore();
bot.init();
bot.on('ready', () => bot.run());