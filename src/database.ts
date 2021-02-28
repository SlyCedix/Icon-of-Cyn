import mongoose from 'mongoose';
import { ReactionRoleModel } from './listeners/reactionRolesListener'

export class Database {
    private uri : string;
    
    constructor(uri : string) {
        this.uri = uri;
        this._connect();
    }

    private _connect() {
        mongoose.connect(this.uri, { useNewUrlParser: true, useUnifiedTopology: true});
    }

    restore() {
        // var testModel = new ReactionRoleModel({
        //     server_id : "807481020131311636",
        //     channel_id : "807746098592481301",
        //     message_id : "815395426294562818",
        //     emojiroles : [{emoji: "<:sheher:807513244800385025>", role: "807511777025327176"},
        //                   {emoji: "<:hehim:807513245228335104>", role: "807511853944799232"},
        //                   {emoji: "🔞", role: "807553742458322975"}]
        // })

        // console.log(testModel);
        // testModel.save();

        // testModel = new ReactionRoleModel({
        //     server_id : "807481020131311636",
        //     message_id : "807765207643848714",
        //     emojiroles : [{emoji: "🔞", role: "807553742458322975"}]
        // })

        // testModel.save();
    }
}