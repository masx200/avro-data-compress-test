export type EncodedArrayOfMessageAvro = {
    sha512: string;
    data: Buffer<Uint8Array>[];
};

export interface EncodedDecodeArrayOfMessageType {
    fromBuffer(buf: Buffer<Uint8Array>): EncodedArrayOfMessageAvro;
    toBuffer(em: EncodedArrayOfMessageAvro): Buffer<Uint8Array>;
}
import avro from "avsc";
import { Buffer } from "node:buffer";

export function parseArrayOfMessageSchema(): EncodedDecodeArrayOfMessageType {
    const MessageType = avro.parse(JSON.stringify(ArrayOfMessageSchema), {});
    return MessageType;
}

export const ArrayOfMessageSchema = {
    "type": "record",
    "name": "ArrayOfMessage",
    "fields": [{
        "name": "data",
        "type": {
            "type": "array",
            "items": "bytes",
        },
    }, {
        "type": "string",
        "name": "sha512",
    }],
};
