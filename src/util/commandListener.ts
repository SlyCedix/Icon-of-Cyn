import { Client, Message } from "discord.js";
import EventEmitter from "events";

export class CommandListener {
    client : Client;
    command : string;
    description : string;
    private emitter : EventEmitter;

    constructor(client : Client,
                command : string,
                description : string) {
        this.client = client;
        this.command = command;
        this.description = description;
        this.emitter = new EventEmitter();

        this.client.on('message', (message) => this._matchCommand(message));
    }

    on(event: string | symbol, listener: (...args: any[]) => void) {
        return this.emitter.on(event, listener);
    }

    private _matchCommand(message : Message) {
        var args = message.content.split(" ");
        if(args[0] === this.command){
            this.emitter.emit("commandMatched", args, message)
        }
    }
}