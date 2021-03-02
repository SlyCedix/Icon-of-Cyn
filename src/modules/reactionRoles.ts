import { Message, MessageEmbed } from 'discord.js';
import Sub from 'subleveldown'
import { CommandListener } from '../util/commandListener';

import { Database } from '../util/database'
import { bot } from '../util/bot'

const ActiveReactionRoleListeners = new Array<ReactionRoleListener>();

class EmojiRole {
    emoji : string;
    role : string;

    constructor (emoji : string,
                 role : string) {
        this.emoji = emoji;
        this.role = role;
    }
}

class ReactionRole {
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

class ReactionRoleListener {
    private reactionRole : ReactionRole;
    message_id : string;

    constructor( reactionRole : ReactionRole) {
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

        if(user.id === bot.client.user.id) return;

        if(reaction.message.id === this.reactionRole.message_id) {
            var server = bot.client.guilds.cache.get(this.reactionRole.server_id);
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

        if(user.id === bot.client.user.id) return;

        if(reaction.message.id === this.reactionRole.message_id) {
            var server = bot.client.guilds.cache.get(this.reactionRole.server_id);
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
        bot.client.on('messageReactionAdd', this._onMessageReactionAdd);
        bot.client.on('messageReactionRemove', this._onMessageReactionRemove);
    }

    disable() {
        bot.client.removeListener('messageReactionAdd', this._onMessageReactionAdd);
        bot.client.removeListener('messageReactionRemove', this._onMessageReactionRemove);
    }
};

class ReactionRoleCommand extends CommandListener {
    constructor() {
        super("!reactionroles", 
            ['MANAGE_ROLES']);

        this.on("commandMatched", this._onCommandMatched);
        this.on("insufficientPerms", this._insufficientPerms);
        this.on("help", this._help);
    }

    private _onCommandMatched = async(args, message) => {
        if(args.length < 4) {
            this._usage(message, "Not enough arguments"); 
            return;
        }
        if(args.length % 2 != 0) {
            this._usage(message, "Emoji/Role Count Mismatch");
            return;
        }

        var messageTarget = await message.channel.messages.fetch(args[1])
            .catch( () => {
                this._usage(message, "Could not locate message");
                return null;
            });

        if(messageTarget === null) return;

        var server_id = message.guild.id;
        var channel_id = message.channel.id;
        var message_id = args[1];
        var emojiroles = new Array<EmojiRole>();

        args.splice(0,2);

        const ReactionRoleDB = await Sub(Database, 'reactionroles');
        const Manifest = JSON.parse(await ReactionRoleDB.get('manifest'));

        if(Manifest.includes(message_id)) {
            this._usage(message, "Message already has reaction roles")
            return;
        }

        var emojiId;

        args.forEach(async (id, idx) => {
            if(idx % 2 === 0) {
                var emoji = message.guild.emojis.resolveIdentifier(id);
                if( emoji === null ) this._usage(message, `Invalid emoji: ${id}`);
                emojiId = id;
            } else {
                var role = message.guild.roles.resolveID(id);
                if ( role === null ) this._usage(message, `Invalid role: ${id}`);
                id = id.slice(3, -1);

                emojiroles.push(new EmojiRole(emojiId, id));

                messageTarget.react(emojiId);
            }
        })

        const reactionRole = new ReactionRole(server_id, channel_id, message_id, emojiroles);
        await Manifest.push(message_id);
        await ReactionRoleDB.put('manifest', JSON.stringify(Manifest));
        await ReactionRoleDB.put(message_id, JSON.stringify(reactionRole));

        ActiveReactionRoleListeners.push(new ReactionRoleListener(reactionRole));

        var emojiString = "";
        var roleString = "";

        emojiroles.forEach((emojirole) => {
            emojiString+=`${emojirole.emoji}\n`;
            roleString+=`${message.guild.roles.resolve(emojirole.role).name}\n`;
        });

        const embed = new MessageEmbed()
            .setTitle(`Reaction roles added to message`)
            .setColor('#34C759')
            .addFields(
                {name: '**Emoji**', value: emojiString, inline: true},
                {name: '**Roles**', value: roleString, inline: true}
            )
            .setURL(`https://discord.com/channels/${server_id}/${channel_id}/${message_id}`);

        message.channel.send(embed);
    }

    private async _usage(message, error) {
        var embed = new MessageEmbed()
            .setTitle(`Reaction Roles`)
            .setDescription(`Allow users to react to a specified message with emojis to set their role`)
            .setColor('#357EC7')
            .addFields(
                {name: '**Usage**', value: `\`!reactionroles $message_id $emoji_1 $rank_1 $emoji_2 $rank_2 ...\``}
            );
        
        if(error != undefined) {
            embed.setColor('#A52856')
            .addFields(
                {name: '**Error**', value: `${error}`}
            );
        }

        message.channel.send(embed);
    }

    private _insufficientPerms = async(args, message) => this._usage(message, `Insufficient Permissions`);
    private _help = async(message) => this._usage(message, null);
}

class DelReactionRoleCommand extends CommandListener {
    constructor() {
        super("!delreactionroles", 
            ['MANAGE_ROLES']);

        this.on("commandMatched", this._onCommandMatched);
        this.on("insufficientPerms", this._insufficientPerms);
        this.on("help", this._help)
    }

    private _onCommandMatched = async(args, message) => {
        if(args.length != 2) {
            this._usage(message, "Incorrect number of arguments"); 
            return;
        }

        const ReactionRoleDB = Sub(Database, 'reactionroles');
        var Manifest = JSON.parse(await ReactionRoleDB.get('manifest'));

        var messageTarget = await message.channel.messages.fetch(args[1]).catch( () => {
            this._usage(message, "Could not locate message");
            return null;
        });

        if(messageTarget === null) return;

        var idx = Manifest.find((value) => {
            return value === args[1]
        })

        if ( idx === undefined ) {
            this._usage(message, "Message does not have reactionroles");
            return;
        }
        Manifest = Manifest.filter((value) => {
            return value != args[1];
        });

        await ReactionRoleDB.put('manifest', JSON.stringify(Manifest));
        await ReactionRoleDB.del(args[1]);

        ActiveReactionRoleListeners.filter((value, idx, arr) => {
            if(value.message_id == args[1]) {
                arr[idx].disable();
                delete arr[idx];
            }
        });

        messageTarget.reactions.removeAll();

        const embed = new MessageEmbed()
            .setTitle(`Successfully removed reaction roles from message`)
            .setColor('#34C759')

        message.channel.send(embed);
    }

    private async _usage(message : Message, error : string) {
        var embed = new MessageEmbed()
            .setTitle(`Delete Reaction Roles`)
            .setDescription(`Delete the existing reaction roles on a given message`)
            .setColor('#357EC7')
            .addFields(
                {name: '**Usage**', value: `\`!delreactionroles $message_id\``}
            );
                
        if(error != null) {
            embed.setColor('#A52856')
            .addFields(
                {name: '**Error**', value: `${error}`}
            );
        }

        message.channel.send(embed);
    }

    private _insufficientPerms = async(args, message) => this._usage(message, `Insufficient Permissions`);
    private _help = async(message) => this._usage(message, null);
}

export class ReactionRoles {
    private _manifest : Array<string>;
    private _reactionRoleCommand : ReactionRoleCommand;
    private _delReactionRoleCommand : DelReactionRoleCommand;

    constructor() {
        this.init();
    }

    async init() {
        const reactionRoleDB = Sub(Database, 'reactionroles')
        this._manifest = JSON.parse(await reactionRoleDB.get('manifest')) as Array<string>;

        this._manifest.forEach(async(message_id) => {
            var reactionRole = JSON.parse(await reactionRoleDB.get(message_id)) as ReactionRole;
            ActiveReactionRoleListeners.push(new ReactionRoleListener(reactionRole))
        })

        this._reactionRoleCommand = new ReactionRoleCommand();
        this._delReactionRoleCommand = new DelReactionRoleCommand();
    }
}