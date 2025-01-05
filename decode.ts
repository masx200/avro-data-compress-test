import { Buffer } from "node:buffer";
import { EncodedMessageBigInt } from "./EncodedMessageBigInt.ts";
import { gzipDecompress } from "./gzipDecompress.ts";

import { bufferToUint8Array } from "./bufferToUint8Array.ts";
import { EncodedDecodeMessageType } from "./EncodedDecodeMessageType.ts";
import { EncodedMessageAvro } from "./EncodedMessageAvro.ts";
import { parseEncodedMessageSchema } from "./parseEncodedMessageSchema.ts";

async function decodeAvroFile(filePath: string): Promise<EncodedMessageBigInt> {
    const MessageType = parseEncodedMessageSchema();

    const newLocal = await Deno.readFile(filePath);

    const buf = Buffer.from(await gzipDecompress(newLocal));

    const decodedMessage: EncodedMessageAvro = MessageType.fromBuffer(buf);
    // console.log(decodedMessage);

    const dictionary = new Map<bigint, Uint8Array>();
    for (const [key, value] of Object.entries(decodedMessage.dictionary)) {
        dictionary.set(BigInt(key.toString()), bufferToUint8Array(value));
    }

    const messages = decodedMessage.messages.map((arr) =>
        BigInt(arr.toString())
    );

    return {
        haveAvroData: decodedMessage.haveAvroData,
        dictionary,
        messages,
    } satisfies EncodedMessageBigInt;
}
if (import.meta.main) {
    const inputfilenames = [
        "example/input3.gz",
        "example/input2.gz",
        "example/input1.gz",
    ];
    const outputfilenames = [
        "example/input3.raw",
        "example/input2.raw",
        "example/input1.raw",
    ];
    for (
        let i = 0;
        i < inputfilenames.length;
        i++
    ) {
        const inputfilename = inputfilenames[i];
        const outputfilename = outputfilenames[i];

        using fsfile = await Deno.open(outputfilename, {
            write: true,
            create: true,
        });
        const decodedData = await decodeAvroFile(inputfilename);

        await Promise.all(decodedData.messages.map(async (arr) => {
            const newLocal_1 = decodedData.dictionary.get(arr);

            if (typeof newLocal_1 === "undefined") {
                throw new Error("undefined");
            }
            await fsfile.write(newLocal_1);
        }));
    }
}
export function NestedCompressedPacketsDecode(
    p: Uint8Array,
    MessageType: EncodedDecodeMessageType,
): Uint8Array {
    const b: EncodedMessageBigInt = decodeToAvroBuffer(p, MessageType);
    const d: Uint8Array = decodeUint8ArrayToMessages(b);

    if (b.haveAvroData) {
        return NestedCompressedPacketsDecode(
            d,
            MessageType,
        );
    }
    return p;
}

function decodeToAvroBuffer(
    p: Uint8Array,
    MessageType: EncodedDecodeMessageType,
): EncodedMessageBigInt {
    const a = MessageType.fromBuffer(Buffer.from(p));
    const dictionary = new Map<bigint, Uint8Array>();
    for (const [key, value] of Object.entries(a.dictionary)) {
        dictionary.set(BigInt(key.toString()), bufferToUint8Array(value));
    }

    const messages = a.messages.map((arr) => BigInt(arr.toString()));

    return {
        haveAvroData: a.haveAvroData,
        dictionary,
        messages,
    } satisfies EncodedMessageBigInt;
}
function decodeUint8ArrayToMessages(b: EncodedMessageBigInt): Uint8Array {
    return Uint8Array.from(
        b.messages.map((a) => {
            const newLocal_2 = b.dictionary.get(a);
            if (typeof newLocal_2 === "undefined") {
                throw new Error("undefined");
            }
            return Array.from(newLocal_2);
        }).flat(),
    );
}
