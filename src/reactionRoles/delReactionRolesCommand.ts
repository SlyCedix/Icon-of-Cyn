import { Client, Message, MessageEmbed } from "discord.js"
import Sub from "subleveldown"

import { CommandListener } from "../util/commandListener";
import { Database } from "../util/database"
import { ActiveReactionRoleListeners } from "./reactionRolesListener";

export class DelReactionRolesCommand extends CommandListener {
    constructor(client : Client) {
        super(client, 
            "!delreactionroles", 
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