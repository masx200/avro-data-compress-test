import { Buffer } from "node:buffer";
import { EncodedMessageBigInt } from "./EncodedMessageBigInt.ts";
import { gzipDeCompress } from "./gzipDecompress.ts";

import { bufferToUint8Array } from "./bufferToUint8Array.ts";
import { EncodedDecodeMessageType } from "./EncodedDecodeMessageType.ts";
import { parseEncodedMessageSchema } from "./parseEncodedMessageSchema.ts";

import {
    EncodedArrayOfMessageAvro,
    parseArrayOfMessageSchema,
} from "./parseArrayOfMessageSchema.ts";
import { calculateSHA512 } from "./calculateSHA512.ts";
import { EncodedMessageAvro } from "./EncodedMessageAvro.ts";
export async function decodeAvroToEncodedArrayOfMessages(
    data: Uint8Array,
): Promise<Uint8Array[]> {
    // Step 1: Decompress the input Uint8Array
    const decompressedData = await gzipDeCompress(data);
    const buf = Buffer.from(decompressedData);

    // Step 2: Parse the decompressed data to get EncodedArrayOfMessageAvro
    const paoms = parseArrayOfMessageSchema();
    const aom: EncodedArrayOfMessageAvro = paoms.fromBuffer(buf);

    // Step 3: Initialize an array to hold the decoded Uint8Arrays
    const decodedDataArray: Uint8Array[] = [];

    // Step 4: Decompress each element in the EncodedArrayOfMessageAvro
    for (const compressedData of aom.data) {
        const decompressedElement = await gzipDeCompress(
            bufferToUint8Array(compressedData),
        );
        // console.log("decompressing", decompressedElement.length);
        decodedDataArray.push(
            decompressedElement,
        );
    }
    console.log(aom);
    const sha512 = calculateSHA512(decodedDataArray);
    if (sha512 != aom.sha512) {
        throw new Error("sha512 mismatch:" + sha512);
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
        "example/input4.gz",
        "example/input3.gz",
        "example/input2.gz",
        "example/input1.gz",
    ];
    const outputfilenames = [
        "example/input4.raw",
        "example/input3.raw",
        "example/input2.raw",
        "example/input1.raw",
    ];
    const promises: Promise<void>[] = [];
    for (
        let i = 0;
        i < inputfilenames.length;
        i++
    ) {
        const inputfilename = inputfilenames[i];
        const outputfilename = outputfilenames[i];
        promises.push(main(inputfilename, outputfilename));
    }
    await Promise.all(promises);
}
async function main(
    inputfilename: string,
    outputfilename: string,
) {
    using fsfile = await Deno.open(outputfilename, {
        write: true,
        create: true,
    });
    const decodedData = await decodeAvroFile(inputfilename);

    await Promise.all(decodedData.map(async (arr) => {
        await fsfile.write(arr);
    }));
}

export function NestedCompressedPacketsDecode(
    p: Uint8Array,
    MessageType: EncodedDecodeMessageType,
): Uint8Array {
    const b: EncodedMessageBigInt = decodeToAvroBuffer(p, MessageType);
    const d: Uint8Array = decodeUint8ArrayToMessages(b);
    const sha512 = calculateSHA512([d]);
    if (sha512 != b.sha512) {
        throw new Error("sha512 mismatch:" + sha512);
    }
    //console.log(b);
    if (b.haveAvroData > 1) {
        return NestedCompressedPacketsDecode(
            d,
            MessageType,
        );
    }
    if (b.haveAvroData == 1) {
        return d;
    }
    return d;
}

function decodeToAvroBuffer(
    p: Uint8Array,
    MessageType: EncodedDecodeMessageType,
): EncodedMessageBigInt {
    const a: EncodedMessageAvro = MessageType.fromBuffer(Buffer.from(p));
    console.log(a);
    const dictionary = new Map<bigint, Uint8Array>();
    for (const [key, value] of Object.entries(a.dictionary)) {
        dictionary.set(BigInt(key.toString()), bufferToUint8Array(value));
    }

    const messages = a.messages.map((arr) => BigInt(arr.toString()));

    return {
        sha512: a.sha512,
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
