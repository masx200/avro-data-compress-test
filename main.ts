//import Long from "long";

import { bufferToUint8Array } from "./bufferToUint8Array.ts";
import { EncodedDecodeMessageType } from "./EncodedDecodeMessageType.ts";
import { EncodedMessageBigInt } from "./EncodedMessageBigInt.ts";
import { EncodedMessageLong } from "./EncodedMessageLong.ts";
import { gzipCompress } from "./gzipCompress.ts";
import { ObjectToArray } from "./ObjectToArray.ts";
import { parseEncodedMessageSchema } from "./parseEncodedMessageSchema.ts";
import { uint8ArrayToHex } from "./uint8ArrayToHex.ts";

import { splitUint8ArrayIntoChunks } from "./splitUint8ArrayIntoChunks.ts";
function handleline(
    options: {
        decode: Map<bigint, Uint8Array>;
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
        decode,
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
        decode.set(newLocal, line);
        map.set(key, [newLocal]);

        return [...map.get(key) as bigint[]];
    } else {
        const newLocal_2 = map.get(key);
        if (typeof newLocal_2 !== "undefined") {
            if (counter.get(key) == 2n) {
                const newLocal = getindex() + 1n;
                setindex(newLocal);
                decode.set(newLocal, line);
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
    const counter = new Map<string, bigint>();
    const decode = new Map<bigint, Uint8Array>();
    decode.set(0n, new Uint8Array());
    const map = new Map<string, bigint[]>();
    let index = 0n;

    // let rawsize = 0n;
    const messages: bigint[][] = [];
    for (
        const line of splitUint8ArrayIntoChunks(content, MAXLINELENGTH)
    ) {
        if (line.length !== 0) {
            // console.log(line);
            // rawsize += BigInt(line.length);
            const newLocal_1 = handleline(
                {
                    decode,
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
        } /* else {
            // messages.push([]);
        } */
    }
    // console.log(Object.fromEntries(counter));
    // console.log(Array.from(decode));
    await saveEncodedMessagesAsAvro(
        decode,
        messages,
        MessageType,
        outputfilename,
    );
}

if (import.meta.main) {
    const inputfilenames = ["input3.txt", "input2.txt", "input1.txt"];
    const outputfilenames = [
        "input3.avro.gz",
        "input2.avro.gz",
        "input1.avro.gz",
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
    dictionary: Map<bigint, Uint8Array>,
    messages: bigint[][],
    MessageType: EncodedDecodeMessageType,
    outputfilename: string,
) {
    const data: EncodedMessageBigInt = {
        dictionary: dictionary,
        messages: messages,
    } satisfies EncodedMessageBigInt;
    // console.log(data);
    const em: EncodedMessageLong = {
        dictionary: ObjectToArray(Object.fromEntries(
            Array.from(data.dictionary).map((
                a,
            ) => [a[0].toString(), a[1]]),
        )),
        messages: data.messages.map((a) => a.map((b) => Number(b.toString()))),
    } satisfies EncodedMessageLong;
    console.log(em);
    const buf = MessageType.toBuffer(em);

    const newLocal_3 = bufferToUint8Array(buf);
    await Deno.writeFile(outputfilename, await gzipCompress(newLocal_3));
}
