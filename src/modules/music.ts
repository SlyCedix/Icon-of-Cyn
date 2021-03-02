import { MessageEmbed, Message, MessageReaction, PartialUser, User } from "discord.js";
import EventEmitter from "events";
import ytsr from 'ytsr';

import { bot } from "../util/bot";
import { CommandListener } from "../util/commandListener";

const MusicQueues = new Map<string, MusicQueue>();

class MusicQueue {
    private _array : Array<string>
    private _idx : number;
    private _last : number

    constructor() {
        this._array = new Array<string>();
        this._idx = -1;
        this._last = -1;

    }

    enqueue(url : string)  {
        this._array.push(url);
        this._last = this._array.length - 1;
    }

    next() {
        if(this._idx < this._last) {
            return this._array[++this._idx];
        } else {
            this._idx = -1;
            return undefined;
        }
    }

    move(idx : number) {
        if(idx < this._array.length - 1) {
            this._idx
        }
    }
}

class MusicSearchCommand extends CommandListener {
    constructor() {
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

        const Results = await ytsr(Query, {safeSearch: true, limit: 5}).catch( (error) => {
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

        const ResultListener = new MusicSearchResultListener(message.author, resultMessage, urls);
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

class MusicSearchResultListener {
    private _user : User;
    private _resultMessage : Message;
    private _eventEmitter : EventEmitter;

    constructor(user : User,
                resultMessage : Message,
                urls : Array<string>){
            this._user = user;
            this._resultMessage = resultMessage;
            this._eventEmitter = new EventEmitter();

            this.enable();
        }

    on(event: string | symbol, listener: (...args: any[]) => void) {
        return this._eventEmitter.on(event, listener);
    }

    removeListener(event: string | symbol, listener: (...args: any[]) => void) {
        return this._eventEmitter.removeListener(event, listener);
    }

    private _onMessageReactionAdd = async (reaction : MessageReaction, user : User | PartialUser)=> {
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

        if(reaction.message.id === this._resultMessage.id) {
            if(user.id === this._user.id) {
                const Emojis = [`1️⃣`, `2️⃣`, `3️⃣`, `4️⃣`, `5️⃣`];
                Emojis.find((value, idx) => {
                    if(value === reaction.emoji.toString()) {
                        this._eventEmitter.emit(`resultVoted`, idx);
                        this._resultMessage.delete();
                        this.disable();
                    }
                })
            }
        } 
    }

    enable() {
        bot.client.on(`messageReactionAdd`, this._onMessageReactionAdd);
    }

    disable() {
        bot.client.removeListener(`messageReactionAdd`, this._onMessageReactionAdd);
    }
}

export class Music {
    constructor() {
        this.init();
    }

    async init() {
        bot.client.guilds.valueOf().forEach((guild) => {
            MusicQueues.set(`guild.id`, new MusicQueue);
        });

        new MusicSearchCommand();
    }
}