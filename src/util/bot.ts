import { Client } from 'discord.js'
import { EventEmitter } from 'events'

import { MusicSearchCommand } from '../modules/music/musicSearch';
import { MusicQueue } from '../modules/music/musicQueue';

import config  from '../config.json'
import { ReactionRoles } from '../modules/reactionRoles';

class Bot {
    client : Client;
    private _token : string;
    private _emitter : EventEmitter;

    constructor() {
        this.client = new Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION']});
        this._emitter = new EventEmitter();
        this._token = config.token;
    }

    on(event: string | symbol, listener: (...args: any[]) => void) {
        return this._emitter.on(event, listener);
    }

    async init() {
        this.client.login(this._token);

        this.client.on('ready', () => {
            console.log(`Logged in as ${this.client.user.username}`);
            this._emitter.emit('ready');
            this.client.user.setPresence({
                status: "dnd"
            })
        });
    }

    async run() {
        // Restore from database
        new ReactionRoles();

        const musicQueues = new Map<string, MusicQueue>();

        this.client.guilds.valueOf().forEach((guild) => {
            musicQueues.set(`guild.id`, new MusicQueue);
        });

        new MusicSearchCommand(musicQueues);

        console.log("Bot Started");
        this.client.user.setPresence({
            status: "online"
        })
    }
}

export const bot = new Bot();