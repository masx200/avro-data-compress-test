export type EncodedArrayOfMessageAvro = Buffer<Uint8Array>[];

export interface EncodedDecodeArrayOfMessageType {
    fromBuffer(buf: Buffer<Uint8Array>): EncodedArrayOfMessageAvro;
    toBuffer(em: EncodedArrayOfMessageAvro): Buffer<Uint8Array>;
}
import avro from "avro-js";
import { Buffer } from "node:buffer";

export function parseArrayOfMessageSchema(): EncodedDecodeArrayOfMessageType {
    const MessageType = avro.parse(ArrayOfMessageSchema, {});
    return MessageType;
}

export const ArrayOfMessageSchema = {
    "type": "array",
    "name": "ArrayOfMessage",
    "items": "bytes",
};
