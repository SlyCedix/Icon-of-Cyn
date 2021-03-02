import { Client, Message, PermissionString } from "discord.js";
import EventEmitter from "events";

export class CommandListener extends EventEmitter{
    client : Client;
    command : string;
    permissions : Array<PermissionString>;

    constructor(client : Client,
                command : string,
                permissions : Array<PermissionString>) {
        super();
        this.client = client;
        this.command = command;
        this.permissions = permissions;
    
        this.client.on('message', this._matchCommand);
    }

    private  _matchCommand = async(message : Message) => {
        var args = message.content.split(" ");
        if(args[0] === this.command){
            if(message.member.hasPermission(this.permissions)) {
                this.emit("commandMatched", args, message);
            } else {
                this.emit("insufficientPerms", args, message);
            }
        }
        
        if(args.length >= 2 && args[0] === `!help` && args[1] === this.command) {
            this.emit("help", message);
        }
    }
}