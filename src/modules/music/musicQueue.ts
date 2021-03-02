import { Guild } from "discord.js";

export class MusicQueue {
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