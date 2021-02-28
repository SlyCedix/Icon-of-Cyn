import { Url } from "url";

export class MusicElement {
    title : string;
    source : string;
    type : string;

    constructor(source : string) {
        this.source = source;
        if (source.toLowerCase().includes("youtube.com") || source.toLowerCase().includes("youtu.be")) {
            this.type = 'YOUTUBE';
            

        } else if (source.toLowerCase().includes("spotify")) {
            this.type = 'SPOTIFY';
        } else {
            this.type = 'UNKNOWN';
        }

    }
}