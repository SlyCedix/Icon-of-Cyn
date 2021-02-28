import mongoose from 'mongoose';
import { ReactionRoleModel } from '../reactionRoles/reactionRolesListener'

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
    }
}