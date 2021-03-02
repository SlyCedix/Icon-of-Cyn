import { Client, Message, MessageEmbed } from 'discord.js'
import Sub from 'subleveldown'

import { EmojiRole, ReactionRole, ReactionRoleListener, ActiveReactionRoleListeners } from '../reactionRoles/reactionRolesListener'
import { CommandListener } from '../util/commandListener'
import { Database } from '../util/database'

export class ReactionRoleCommand extends CommandListener {
    constructor(client : Client) {
        super(client, 
            "!reactionroles", 
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

        ActiveReactionRoleListeners.push(new ReactionRoleListener(this.client, reactionRole));

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