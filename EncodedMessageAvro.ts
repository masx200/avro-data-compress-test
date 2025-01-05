import { Buffer } from "node:buffer";

export interface EncodedMessageAvro {
    dictionary: Buffer<Uint8Array>[];
    messages: Buffer<Uint8Array>;
    // haveAvroData: boolean;
    sha512: string;
}
// //import Long from "long";
