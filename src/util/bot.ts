import { Channel, Client, Message, TextChannel } from 'discord.js';
import { EventEmitter } from 'events';
import { Database } from './database';

import { ReactionRoleListener, ReactionRoleModel } from '../reactionRoles/reactionRolesListener'

import mongoose from 'mongoose';
import { ReactionRoleCommand } from '../reactionRoles/reactionRolesCommand';

export class Bot {
    private client : Client;
    private token : string;
    private emitter : EventEmitter;
    private database : Database;
    
    constructor(token: string, database: Database) {
        this.client = new Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION']});
        this.emitter = new EventEmitter();
        this.token = token;
        this.database = database;
    }

    on(event: string | symbol, listener: (...args: any[]) => void) {
        return this.emitter.on(event, listener);
    }

    async init() {
        this.client.login(this.token);

        this.client.on('ready', () => {
            this.emitter.emit('ready');
        });
    }

    async run() {
        // Restore from database
        var reactionRoles = await ReactionRoleModel.find().lean();
        reactionRoles.forEach(async(reactionRole) => {
            var server_id = reactionRole["server_id"];
            var channel_id = reactionRole["channel_id"];
            var message_id = reactionRole["message_id"];
            var emojirolesObject = reactionRole["emojiroles"];

            var channel = await this.client.channels.fetch(channel_id)
                            .then(c => { return c as TextChannel });

            var message = await channel.messages.fetch(message_id);
            
            var emojirolesMap = new Map<string, string>();
            emojirolesObject.forEach((emojirole) => {
                emojirolesMap.set(emojirole["emoji"], emojirole["role"]);
                message.react(emojirole["emoji"]);
            })
            new ReactionRoleListener(this.client, server_id, message_id, emojirolesMap);
        });

        // Register commands
        new ReactionRoleCommand(this.client);

    }
}