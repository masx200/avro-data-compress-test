//import Long from "long";

import { bufferToUint8Array } from "./bufferToUint8Array.ts";
import { EncodedDecodeMessageType } from "./EncodedDecodeMessageType.ts";
import { EncodedMessageAvro } from "./EncodedMessageAvro.ts";
import { EncodedMessageBigInt } from "./EncodedMessageBigInt.ts";
import { gzipCompress } from "./gzipCompress.ts";
import { ObjectToArray } from "./ObjectToArray.ts";
import { parseEncodedMessageSchema } from "./parseEncodedMessageSchema.ts";
import { uint8ArrayToHex } from "./uint8ArrayToHex.ts";

import { splitUint8ArrayIntoChunks } from "./splitUint8ArrayIntoChunks.ts";
import {
    EncodedArrayOfMessageAvro,
    parseArrayOfMessageSchema,
} from "./parseArrayOfMessageSchema.ts";
import { Buffer } from "node:buffer";
function handleline(
    options: {
        dictionary: Map<bigint, Uint8Array>;
        line: Uint8Array;
        MAXLINELENGTH: number;
        counter: Map<string, bigint>;
        getindex: () => bigint;
        setindex: (v: bigint) => void;
        map: Map<string, bigint[]>;
    },
): bigint[] {
    const {
        line,
        MAXLINELENGTH,
        counter,
        getindex,
        setindex,
        map,
        dictionary,
    } = options;
    if (line.length > MAXLINELENGTH) {
        return splitUint8ArrayIntoChunks(line, MAXLINELENGTH).map((a) =>
            handleline({ ...options, line: a, MAXLINELENGTH })
        )
            .flat();
    }
    const key = uint8ArrayToHex(line);
    counter.set(key, (counter.get(key) ?? 0n) + 1n);
    if (!map.get(key) && (line.length == 1)) {
        const newLocal = getindex() + 1n;
        setindex(newLocal);
        dictionary.set(newLocal, line);
        map.set(key, [newLocal]);

        return [...map.get(key) as bigint[]];
    } else {
        const newLocal_2 = map.get(key);
        if (typeof newLocal_2 !== "undefined") {
            if (counter.get(key) == 2n) {
                const newLocal = getindex() + 1n;
                setindex(newLocal);
                dictionary.set(newLocal, line);
                map.set(key, [newLocal]);
                return [newLocal];
            }
            return newLocal_2;
        }
        const middle = Math.floor(line.length / 2);
        const [prefix, rest] = [line.slice(0, middle), line.slice(middle)];

        const result = [prefix, rest].filter(Boolean).map((a) => [
            ...handleline({
                ...options,
                line: a,
                MAXLINELENGTH,
            }),
        ]).flat();
        map.set(key, result);
        return result;
    }
}

async function main(inputfilename: string, outputfilename: string) {
    const MessageType = parseEncodedMessageSchema();

    const content = await Deno.readFile(inputfilename);
    const MAXLINELENGTH = 1024; //32; //64; //128; //256; //512; //1024;
    const MAXCHUNCKLENGTH = 1024 * 5351;
    const dataarray: Uint8Array[] = splitUint8ArrayIntoChunks(
        content,
        MAXCHUNCKLENGTH,
    ).map((c) => (encodeUint8ArrayToMessages(c, MAXLINELENGTH))).map((c) =>
        encodeToAvroBuffer(c, MessageType)
    );

    // console.log(Object.fromEntries(counter));
    // console.log(Array.from(decode));
    await saveEncodedMessagesAsAvro(
        dataarray,
        outputfilename,
    );
}

if (import.meta.main) {
    const inputfilenames = [
        "example/input3.txt",
        "example/input2.txt",
        "example/input1.txt",
    ];
    const outputfilenames = [
        "example/input3.gz",
        "example/input2.gz",
        "example/input1.gz",
    ];

    for (
        let i = 0;
        i < inputfilenames.length;
        i++
    ) {
        const inputfilename = inputfilenames[i];
        const outputfilename = outputfilenames[i];
        await main(inputfilename, outputfilename);
    }
}

async function saveEncodedMessagesAsAvro(
    dataarray: Uint8Array[],
    outputfilename: string,
) {
    const aom: EncodedArrayOfMessageAvro = [];
    for (const data of dataarray) {
        // console.log(data);

        aom.push(Buffer.from(await gzipCompress(data)));
        // await Deno.writeFile(outputfilename, );
    }
    const paoms = parseArrayOfMessageSchema();
    const newLocal_4 = await gzipCompress(
        bufferToUint8Array(paoms.toBuffer(aom)),
    );
    await Deno.writeFile(
        outputfilename,
        newLocal_4,
    );
}
export function encodeUint8ArrayToMessages(
    c: Uint8Array,
    MAXLINELENGTH: number,
): EncodedMessageBigInt {
    const counter = new Map<string, bigint>();
    const dictionary = new Map<bigint, Uint8Array>();
    dictionary.set(0n, new Uint8Array());
    const map = new Map<string, bigint[]>();
    let index = 0n;

    // let rawsize = 0n;
    const messages: bigint[][] = [];
    // let count = 0;
    for (const line of splitUint8ArrayIntoChunks(c, MAXLINELENGTH)) {
        if (line.length !== 0) {
            // console.log("读取到第" + count + "次");
            // console.log(line);
            // rawsize += BigInt(line.length);
            const newLocal_1 = handleline(
                {
                    dictionary,
                    line,
                    MAXLINELENGTH,
                    counter,
                    getindex: () => index,
                    setindex: (v) => index = v,
                    map,
                },
            );
            messages.push(newLocal_1);
            // console.log("encode", { line, result: newLocal_1 });
            // console.log("decode", {
            //     result: newLocal_1,
            //     line: newLocal_1.map((a) => {
            //         const newLocal_3 = (decode.get(a)) as string;
            //         return newLocal_3;
            //     }).join(""),
            // });
            // count++;
        } /* else {
// messages.push([]);
} */
    }
    console.log(map);
    const data: EncodedMessageBigInt = {
        dictionary: dictionary,
        messages: messages.flat(),
    } satisfies EncodedMessageBigInt;
    return data;
}
export function encodeToAvroBuffer(
    data: EncodedMessageBigInt,
    MessageType: EncodedDecodeMessageType,
): Uint8Array {
    const em: EncodedMessageAvro = {
        dictionary: ObjectToArray(
            Array.from(data.dictionary), /* .map((
                a,
            ) => [a[0].toString(), a[1]]),
        ) */
        ),
        messages: data.messages.map((a) => Number(a.toString())),
    } satisfies EncodedMessageAvro;
    // console.log(em);
    const buf = MessageType.toBuffer(em);

    const newLocal_3 = bufferToUint8Array(buf);
    return newLocal_3;
}
