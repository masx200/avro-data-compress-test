import { Buffer } from "node:buffer";

export interface EncodedMessageLong {
    dictionary: Buffer<Uint8Array>[];
    messages: number[][];
}
// //import Long from "long";
