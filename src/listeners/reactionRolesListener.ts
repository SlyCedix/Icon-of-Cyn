import { Client, Emoji } from 'discord.js';
import mongoose, { Schema } from 'mongoose';

export class ReactionRoleListener {
    private client : Client;
    private server_id : string;
    private message_id : string;
    private emojiroles : Map<string, string>;

    constructor( client : Client,
                 server_id : string,
                 message_id : string,
                 emojiroles : Map<string, string> ) {
        this.client = client;
        this.server_id = server_id;
        this.message_id = message_id;
        this.emojiroles = emojiroles;

        this.client.on('messageReactionAdd', (reaction, user) => this._onMessageReactionAdd(reaction, user));
        this.client.on('messageReactionRemove', (reaction, user) => this._onMessageReactionRemove(reaction, user));
    }

    private async _onMessageReactionAdd(reaction, user) {
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

        if(reaction.message.id === this.message_id) {
            var server = this.client.guilds.cache.get(this.server_id);
            this.emojiroles.forEach((value, key) => {
                if (reaction.emoji.toString() === key) {
                    let serverUser = server.members.cache.get(user.id);
                    const role = server.roles.cache.get(value);
                    serverUser.roles.add(role);
                }
            });
        }
    }

    private async _onMessageReactionRemove(reaction, user) {
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

        if(reaction.message.id === this.message_id) {
            var server = this.client.guilds.cache.get(this.server_id);
            this.emojiroles.forEach((value, key) => {
                if (reaction.emoji.toString() === key) {
                    const role = server.roles.cache.get(value);
                    let serverUser = server.members.cache.get(user.id);
                    serverUser.roles.remove(role);
                }
            });
        }
    }
};

const emojiroleSchema = new Schema({
    emoji : String,
    role : String
})

const reactionRoleSchema = new Schema({
    server_id : String,
    channel_id : String,
    message_id : String,
    emojiroles : [emojiroleSchema]
})

export const EmojiroleModel = mongoose.model('Emojirole', emojiroleSchema)
export const ReactionRoleModel = mongoose.model('ReactionRole', reactionRoleSchema)