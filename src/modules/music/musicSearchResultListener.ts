import { Client, Message, MessageReaction, PartialUser, User } from "discord.js";
import EventEmitter from "events";

export class MusicSearchResultListener {
    private _client : Client;
    private _user : User;
    private _resultMessage : Message;
    private _eventEmitter : EventEmitter;

    constructor(client : Client,
                user : User,
                resultMessage : Message,
                urls : Array<string>){
            this._client = client;
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
        this._client.on(`messageReactionAdd`, this._onMessageReactionAdd);
    }

    disable() {
        this._client.removeListener(`messageReactionAdd`, this._onMessageReactionAdd);
    }
}