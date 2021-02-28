import {Bot} from './util/bot';
import {Database} from './util/database'
import config from './config.json';

const database = new Database(config.mongoString);
const bot = new Bot(config.token, database);

database.restore();
bot.init();
bot.on('ready', () => bot.run());