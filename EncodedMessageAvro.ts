import { Buffer } from "node:buffer";

export interface EncodedMessageAvro {
    dictionary: Buffer<Uint8Array>[];
    messages: number[];
}
// //import Long from "long";
