export function parseEncodedMessageSchema(): EncodedDecodeMessageType {
    // const longType = avro.types.LongType.using({
    //     fromBuffer: function (
    //         buf: { readInt32LE: (arg0?: number | undefined) => number },
    //     ) {
    //         return new Long(buf.readInt32LE(), buf.readInt32LE(4));
    //     },
    //     toBuffer: function (
    //         n: { getLowBits: () => number; getHighBits: () => number },
    //     ) {
    //         const buf = new Buffer(8);
    //         buf.writeInt32LE(n.getLowBits());
    //         buf.writeInt32LE(n.getHighBits(), 4);
    //         return buf;
    //     },
    //     fromJSON: Long.fromValue,
    //     toJSON: function (n: string | number) {
    //         return +n;
    //     },
    //     isValid: Long.isLong,
    //     compare: (n1: number, n2: string | number | Long) =>
    //         new Long(n1).compare(n2),
    // });

    // 定义消息的AVRO模式

    // 解析AVRO模式
    const MessageType = avro.parse(MessageSchema, {
        // registry: { "long": longType },
    });
    return MessageType;
}
import avro from "avro-js";
// //import Long from "long";
// import { Buffer } from "node:buffer";

import { EncodedDecodeMessageType } from "./EncodedDecodeMessageType.ts";
export const MessageSchema = {
    "type": "record",
    "name": "EncodedMessage",
    "fields": [
        {
            "name": "dictionary",
            "type": {
                "type": "array",
                "items": "bytes",
            },
        },
        {
            "name": "messages",
            "type": {
                "type": "array",
                "items": "int",
            },
        },
    ],
};
