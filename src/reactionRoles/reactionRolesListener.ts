import { Client } from 'discord.js';

export class EmojiRole {
    emoji : string;
    role : string;

    constructor (emoji : string,
                 role : string) {
        this.emoji = emoji;
        this.role = role;
    }
}

export class ReactionRole {
    server_id : string;
    channel_id : string;
    message_id : string;
    emojiroles : Array<EmojiRole>;

    constructor (server_id : string,
                 channel_id : string,
                 message_id : string,
                 emojiroles : Array<EmojiRole>) {
        this.server_id = server_id;
        this.channel_id = channel_id;
        this.message_id = message_id;
        this.emojiroles = emojiroles;
    }
}

export class ReactionRoleListener {
    private client : Client;
    private reactionRole : ReactionRole;
    message_id : string;

    constructor( client : Client,
                reactionRole : ReactionRole) {
        this.client = client;
        this.reactionRole = reactionRole;
        this.message_id = reactionRole.message_id;

        this.enable();
    }

    private _onMessageReactionAdd = async (reaction, user) => {
        if (reaction.partial) {
            try { 
                await reaction.fetch();
            } catch (error) {
                console.error('Could not fetch reaction: ', error);
                return;
            };
        };

        if(user.partial) {
            try { 
                await user.fetch();
            } catch (error) {
                console.error('Could not fetch user: ', error);
                return;
            };
        }

        if(user.id === this.client.user.id) return;

        if(reaction.message.id === this.reactionRole.message_id) {
            var server = this.client.guilds.cache.get(this.reactionRole.server_id);
            this.reactionRole.emojiroles.forEach((emojiRole) => {
                if (reaction.emoji.toString() === emojiRole.emoji) {
                    let serverUser = server.members.cache.get(user.id);
                    const role = server.roles.cache.get(emojiRole.role);
                    serverUser.roles.add(role);
                }
            });
        }
    }

    private _onMessageReactionRemove = async (reaction, user) => {
        if (reaction.partial) {
            try { 
                await reaction.fetch();
            } catch (error) {
                console.error('Could not fetch reaction: ', error);
                return;
            };
        };

        if(user.partial) {
            try { 
                await user.fetch();
            } catch (error) {
                console.error('Could not fetch user: ', error);
                return;
            };
        }

        if(user.id === this.client.user.id) return;

        if(reaction.message.id === this.reactionRole.message_id) {
            var server = this.client.guilds.cache.get(this.reactionRole.server_id);
            this.reactionRole.emojiroles.forEach((emojiRole) => {
                if (reaction.emoji.toString() === emojiRole.emoji) {
                    let serverUser = server.members.cache.get(user.id);
                    const role = server.roles.cache.get(emojiRole.role);
                    serverUser.roles.remove(role);
                }
            });
        }
    }

    enable() {
        this.client.on('messageReactionAdd', this._onMessageReactionAdd);
        this.client.on('messageReactionRemove', this._onMessageReactionRemove);
    }

    disable() {
        this.client.removeListener('messageReactionAdd', this._onMessageReactionAdd);
        this.client.removeListener('messageReactionRemove', this._onMessageReactionRemove);
    }
};

export const ActiveReactionRoleListeners = Array<ReactionRoleListener>();