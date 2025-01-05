export interface EncodedDecodeMessageType {
    fromBuffer(buf: Buffer<Uint8Array>): EncodedMessageAvro;
    toBuffer(em: EncodedMessageAvro): Buffer<Uint8Array>;
}
import { Buffer } from "node:buffer";
import { EncodedMessageAvro } from "./EncodedMessageAvro.ts";
