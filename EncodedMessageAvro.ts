import { Buffer } from "node:buffer";

export interface EncodedMessageAvro {
    dictionary: Buffer<Uint8Array>[];
    messages: number[];
    haveAvroData: number;
    sha512: string;
}
// //import Long from "long";
