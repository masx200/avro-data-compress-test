export function parseEncodedMessageSchema(): EncodedDecodeMessageType {
    const MessageType = avro.parse(MessageSchema, {});
    return MessageType;
}
import avro from "avro-js";

import { EncodedDecodeMessageType } from "./EncodedDecodeMessageType.ts";
export const MessageSchema = {
    "type": "record",
    "name": "EncodedMessage",
    "fields": [{
        "type": "string",
        "name": "sha512",
    }, {
        "name": "haveAvroData",
        "type": "int",
    }, {
        "name": "dictionary",
        "type": {
            "type": "array",
            "items": "bytes",
        },
    }, {
        "name": "messages",
        "type": "bytes",
    }],
};
