import { MusicElement } from "./musicElement";

export class musicQueue {
    private _list : Array<MusicElement>;
    private _index : number;

    constructor() {
        this._list = new Array<MusicElement>();
        this._index = -1;
    }

    enqueue(link : string) {
        var musicElement = new MusicElement(link);
    }

    dequeue(index : number) {
        this._list.splice(index, 1);
        this._index--;
    }
}