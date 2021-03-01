import { Client } from 'discord.js'
import { EventEmitter } from 'events'
import Sub from 'subleveldown'

import { Database } from '../util/database';
import { ReactionRoleListener, ReactionRole, ActiveReactionRoleListeners } from '../reactionRoles/reactionRolesListener'
import { ReactionRoleCommand } from '../reactionRoles/reactionRolesCommand'

export class Bot {
    private client : Client;
    private token : string;
    private emitter : EventEmitter;

    constructor(token: string) {
        this.client = new Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION']});
        this.emitter = new EventEmitter();
        this.token = token;
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
        const reactionRoleDB = await Sub(Database, 'reactionroles')
        const reactionRoleManifest = JSON.parse(await reactionRoleDB.get('manifest')) as Array<string>;

        reactionRoleManifest.forEach(async(message_id) => {
            var reactionRole = JSON.parse(await reactionRoleDB.get(message_id)) as ReactionRole;
            ActiveReactionRoleListeners.push(new ReactionRoleListener(this.client, reactionRole))
        })

        // Register commands
        new ReactionRoleCommand(this.client);

    }
}