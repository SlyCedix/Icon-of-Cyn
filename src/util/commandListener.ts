import { Message, PermissionString } from "discord.js";
import EventEmitter from "events";

import { bot } from "./bot";

export class CommandListener extends EventEmitter{
    command : string;
    permissions : Array<PermissionString>;

    constructor(command : string,
                permissions : Array<PermissionString>) {
        super();
        this.command = command;
        this.permissions = permissions;
    
        bot.client.on('message', this._matchCommand);
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