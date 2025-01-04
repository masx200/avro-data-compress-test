export interface EncodedDecodeMessageType {
    fromBuffer(buf: Buffer<Uint8Array>): EncodedMessageLong;
    toBuffer(em: EncodedMessageLong): Buffer<Uint8Array>;
}
import { Buffer } from "node:buffer";
import { EncodedMessageLong } from "./EncodedMessageLong.ts";
