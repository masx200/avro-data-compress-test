import { Buffer } from "node:buffer";

export interface EncodedMessageAvro {
    dictionary: Buffer<Uint8Array>[];
    messages: number[];
    haveAvroData: boolean;
}
// //import Long from "long";
