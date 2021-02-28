import { Client, Message, MessageEmbed } from 'discord.js'
import { EmojiroleModel, ReactionRoleListener, ReactionRoleModel } from './reactionRolesListener';

import { CommandListener } from '../util/commandListener'

export class ReactionRoleCommand extends CommandListener {
    constructor(client : Client) {
        super(client, 
            "!reactionroles", 
            "Add reactionroles to a message");

        this.on("commandMatched", (args, message) => this._onCommandMatched(args, message));
    }

    private async _onCommandMatched(args, message : Message) {
        if(args.length < 4) {
            this._usage(message, "not enough arguments"); 
            return;
        }
        if(args.length % 2 != 0) {
            this._usage(message, "emoji/role count mismatch");
            return;
        }

        var messageTarget = await message.channel.messages.fetch(args[1])
            .catch( () => {
                this._usage(message, "invalid message");
                return null;
            });

        if(messageTarget === null) return;

        var server_id = message.guild.id;
        var channel_id = message.channel.id;
        var message_id = args[1];
        var emojirolesMap = new Map<string, string>();

        args.splice(0,2);

        var emojiId;

        var emojiroles = [];

        args.forEach(async (id, idx) => {
            if(idx % 2 === 0) {
                var emoji = message.guild.emojis.resolveIdentifier(id);
                if( emoji === null ) this._usage(message, "invalid emoji");
                emojiId = id;
            } else {
                var role = message.guild.roles.resolveID(id);
                if ( role === null ) this._usage(message, "invalid role");
                id = id.slice(3, -1);

                emojirolesMap.set(emojiId, id);

                emojiroles.push(new EmojiroleModel({
                    emoji: emojiId,
                    role: id
                }))

                messageTarget.react(emojiId);
            }
        })

        const model = new ReactionRoleModel({
            server_id : server_id,
            channel_id : channel_id,
            message_id : message_id,
            emojiroles : emojiroles
        })

        new ReactionRoleListener(this.client, server_id, message_id, emojirolesMap);
        await model.save();

        var emojiString = "";
        var roleString = "";

        emojirolesMap.forEach((value, key) => {
            emojiString+=`${key}\n`;
            roleString+=`${message.guild.roles.resolve(value).name}\n`;
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
        const embed = new MessageEmbed()
            .setTitle(`Reaction Roles`)
            .setDescription(`Allow users to react to a specified message with emojis to set their role`)
            .setColor('#357EC7')
            .addFields(
                {name: '**Usage**', value: `\`!reactionroles $message_id $emoji_1 $rank_1 $emoji_2 $rank_2 ...\``, inline: true}
            );
        
        message.channel.send(embed);
    }
}