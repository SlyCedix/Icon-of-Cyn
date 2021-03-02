import { Message, MessageEmbed } from "discord.js";
import YouTube from "ytsr";
import { bot } from "../../util/bot";
import { CommandListener } from "../../util/commandListener";
import { MusicQueue } from "./musicQueue";
import { MusicSearchResultListener } from "./musicSearchResultListener";

export class MusicSearchCommand extends CommandListener {
    constructor(musicQueues : Map<string, MusicQueue>) {
        super("!search",
            ["SPEAK"]);

        this.on("commandMatched", this._onCommandMatched);
        this.on("insufficientPerms", this._insufficientPerms);
        this.on("help", this._help)
    }

    private _onCommandMatched = async(args, message) => { 
        if(args.length < 2) {
            this._usage(message, `Cannot search empty string`);
            return;
        }

        args.shift();
        const Query = args.join(` `);

        const Results = await YouTube(Query, {safeSearch: true, limit: 5}).catch( (error) => {
            this._usage(message, error);
            return null;
        })

        if(Results === null) {
            return;
        }
        
        var value = ``;
        var urls = [];
        const Emojis = [`1️⃣`, `2️⃣`, `3️⃣`, `4️⃣`, `5️⃣`];
        
        Results.items.forEach((item, idx) => {
            value+=`${Emojis[idx]}: [${item.title}](${item.url})\n`
            urls.push(item.url);
        });

        const Embed = new MessageEmbed()
            .setTitle(`Youtube Results`)
            .setDescription(`React to select a song`)
            .setColor(`#34C759`)
            .addField(`Results`, value)

        var resultMessage = await message.channel.send(Embed) as Message;
        
        Emojis.forEach(async(emoji) => {
            resultMessage.react(emoji);
        })

        const ResultListener = new MusicSearchResultListener(bot.client, message.author, resultMessage, urls);
        const onResultVoted = async (idx) => {
            const Result = Results.items[idx];
            const Embed = new MessageEmbed()
                .setTitle(`Song added to queue`)
                .setColor(`#34C759`)
                .setThumbnail(`${Result.bestThumbnail.url}`)
                .setDescription(`[${Result.title}](${Result.url})`);
            await message.channel.send(Embed);
        }

        ResultListener.on(`resultVoted`, onResultVoted);
        setTimeout(() => { 
            ResultListener.disable();
            ResultListener.removeListener(`resultVoted`, onResultVoted);
        }, 60000)
    }

    private async _usage(message : Message, error : string) {
        var embed = new MessageEmbed()
            .setTitle(`Search YouTube Videos`)
            .setDescription(`Searches for YouTube videos to be played as music`)
            .setColor('#357EC7')
            .addFields(
                {name: '**Usage**', value: `\`!search $query\``}
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