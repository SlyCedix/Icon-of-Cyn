import { Client, Message, PermissionString } from "discord.js";
import EventEmitter from "events";

export class CommandListener extends EventEmitter{
    client : Client;
    command : string;
    description : string;
    permissions : Array<PermissionString>;

    constructor(client : Client,
                command : string,
                description : string,
                permissions : Array<PermissionString>) {
        super();
        this.client = client;
        this.command = command;
        this.description = description;
        this.permissions = permissions;
    
        this.client.on('message', (message) => this._matchCommand(message));
    }

    private _matchCommand(message : Message) {
        var args = message.content.split(" ");
        if(args[0] === this.command){
            if(message.member.hasPermission(this.permissions)) {
                this.emit("commandMatched", args, message);
            } else {
                this.emit("insufficientPerms", args, message);
            }
        }
    }
}