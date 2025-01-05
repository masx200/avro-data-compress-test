import { Buffer } from "node:buffer";
import { EncodedMessageBigInt } from "./EncodedMessageBigInt.ts";
import { gzipDecompress } from "./gzipDecompress.ts";

import { bufferToUint8Array } from "./bufferToUint8Array.ts";
import { EncodedDecodeMessageType } from "./EncodedDecodeMessageType.ts";
import { parseEncodedMessageSchema } from "./parseEncodedMessageSchema.ts";

import {
    EncodedArrayOfMessageAvro,
    parseArrayOfMessageSchema,
} from "./parseArrayOfMessageSchema.ts";
export async function decodeAvroToEncodedArrayOfMessages(
    data: Uint8Array,
): Promise<Uint8Array[]> {
    // Step 1: Decompress the input Uint8Array
    const decompressedData = await gzipDecompress(data);
    const buf = Buffer.from(decompressedData);

    // Step 2: Parse the decompressed data to get EncodedArrayOfMessageAvro
    const paoms = parseArrayOfMessageSchema();
    const aom: EncodedArrayOfMessageAvro = paoms.fromBuffer(buf);

    // Step 3: Initialize an array to hold the decoded Uint8Arrays
    const decodedDataArray: Uint8Array[] = [];

    // Step 4: Decompress each element in the EncodedArrayOfMessageAvro
    for (const compressedData of aom) {
        const decompressedElement = await gzipDecompress(
            bufferToUint8Array(compressedData),
        );
        decodedDataArray.push(
            bufferToUint8Array(Buffer.from(decompressedElement)),
        );
    }

    return decodedDataArray;
}
async function decodeAvroFile(filePath: string): Promise<Uint8Array[]> {
    const MessageType = parseEncodedMessageSchema();

    const newLocal = await Deno.readFile(filePath);
    const b = await decodeAvroToEncodedArrayOfMessages(newLocal);
    return b.map((arr) => NestedCompressedPacketsDecode(arr, MessageType));
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
    await main(inputfilenames, outputfilenames);
}
async function main(
    inputfilenames: string[],
    outputfilenames: string[],
) {
    for (let i = 0; i < inputfilenames.length; i++) {
        const inputfilename = inputfilenames[i];
        const outputfilename = outputfilenames[i];

        using fsfile = await Deno.open(outputfilename, {
            write: true,
            create: true,
        });
        const decodedData = await decodeAvroFile(inputfilename);

        await Promise.all(decodedData.map(async (arr) => {
            await fsfile.write(arr);
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
