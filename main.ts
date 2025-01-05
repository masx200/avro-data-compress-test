import { bufferToUint8Array } from "./bufferToUint8Array.ts";
import { EncodedDecodeMessageType } from "./EncodedDecodeMessageType.ts";
import { EncodedMessageAvro } from "./EncodedMessageAvro.ts";

import { gzipCompress } from "./gzipCompress.ts";
import { ObjectToArray } from "./ObjectToArray.ts";
import { parseEncodedMessageSchema } from "./parseEncodedMessageSchema.ts";
import { uint8ArrayToHex } from "./uint8ArrayToHex.ts";

import { Buffer } from "node:buffer";
import { calculateSHA512 } from "./calculateSHA512.ts";
import {
    EncodedArrayOfMessageAvro,
    parseArrayOfMessageSchema,
} from "./parseArrayOfMessageSchema.ts";
import { splitUint8ArrayIntoChunks } from "./splitUint8ArrayIntoChunks.ts";
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
/**
 * 主函数，负责读取输入文件，压缩内容，并将压缩后的数据保存到输出文件
 * @param inputfilename 输入文件名
 * @param outputfilename 输出文件名
 */
async function main(inputfilename: string, outputfilename: string) {
    const MessageType = parseEncodedMessageSchema();

    const content = await Deno.readFile(inputfilename);
    const MAXLINELENGTH = 1024;
    const MAXCHUNCKLENGTH = 1024 * 1024;
    const dataarray: Uint8Array[] = splitUint8ArrayIntoChunks(
        content,
        MAXCHUNCKLENGTH,
    );

    const newLocal_5 = await Promise.all(
        dataarray.map((a) => {
            return gzipCompress(a);
        }),
    );
    await saveEncodedMessagesAsAvro(
        newLocal_5.map((c) => {
            return CompressedPacketsEncode(
                c,
                MAXLINELENGTH,
                MessageType,
            );
            /*   }).map((c) => {
            //先测试压缩两次的效果
            return CompressedPacketsEncode(
                c,
                MAXLINELENGTH,
                MessageType,
            ); */
        }),
        outputfilename,
    );
}

if (import.meta.main) {
    const inputfilenames = [
        "example/input4.txt",
        "example/input3.txt",
        "example/input2.txt",
        "example/input1.txt",
        "example/input5.txt",
    ];
    const outputfilenames = [
        "example/input4.gz",
        "example/input3.gz",
        "example/input2.gz",
        "example/input1.gz",
        "example/input5.gz",
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
export async function EncodedArrayOfMessagesAsAvro(
    dataarray: Uint8Array[],
): Promise<Uint8Array> {
    const sha512 = calculateSHA512(dataarray);
    const aom: EncodedArrayOfMessageAvro = { data: [], sha512: sha512 };
    for (const data of dataarray) {
        aom.data.push(Buffer.from(await gzipCompress(data)));
    }
    const paoms = parseArrayOfMessageSchema();
    console.log(aom);
    const newLocal_4 = await gzipCompress(
        bufferToUint8Array(paoms.toBuffer(aom)),
    );

    return newLocal_4;
}
async function saveEncodedMessagesAsAvro(
    dataarray: Uint8Array[],
    outputfilename: string,
) {
    const newLocal_4 = await EncodedArrayOfMessagesAsAvro(dataarray);
    await Deno.writeFile(
        outputfilename,
        newLocal_4,
    );
}
export function encodeUint8ArrayToMessages(
    c: Uint8Array,
    MAXLINELENGTH: number,
): EncodedMessageAvro {
    const sha512 = calculateSHA512([c]);
    const counter = new Map<string, bigint>();
    const dictionary = new Map<bigint, Uint8Array>();
    dictionary.set(0n, new Uint8Array());
    const map = new Map<string, bigint[]>();
    let index = 0n;

    const messages: bigint[][] = [];

    for (const line of splitUint8ArrayIntoChunks(c, MAXLINELENGTH)) {
        if (line.length !== 0) {
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
        }
    }

    const data: EncodedMessageAvro = {
        sha512: sha512,

        dictionary: ObjectToArray(
            Array.from(dictionary),
        ),
        messages: Array.from(messages.flat()).map((a) => Number(a.toString())),
    } satisfies EncodedMessageAvro;
    return data;
}
export function encodeToAvroBuffer(
    data: EncodedMessageAvro,
    MessageType: EncodedDecodeMessageType,
): Uint8Array {
    const em: EncodedMessageAvro = {
        sha512: data.sha512,

        dictionary: data.dictionary,
        messages: data.messages,
    } satisfies EncodedMessageAvro;

    console.log(em);
    const buf = MessageType.toBuffer(em);

    const newLocal_3 = bufferToUint8Array(buf);
    return newLocal_3;
}
/**
 * 这段 TypeScript 代码定义了一个函数 CompressedPacketsEncode，用于对输入的字节数组进行编码和压缩。具体功能如下：
*
将输入的字节数组 p 编码为消息列表，并设置是否包含 Avro 数据。
将消息列表编码为 Avro 缓冲区。
如果编码后的缓冲区长度小于原始字节数组长度，则递归调用自身继续压缩，直到无法进一步压缩为止。
返回最终的字节数组及是否包含 Avro 数据的标志。
*/
export function CompressedPacketsEncode(
    p: Uint8Array,
    MAXLINELENGTH: number,
    MessageType: EncodedDecodeMessageType,
): Uint8Array {
    const d = encodeUint8ArrayToMessages(p, MAXLINELENGTH);
    /*    d = encodeToAvroMessageRecursion(d, MAXLINELENGTH, MessageType); */
    const b = encodeToAvroBuffer(d, MessageType);

    return b;
}
/*
export function encodeToAvroMessageRecursion(
    data: EncodedMessageAvro,
    MAXLINELENGTH: number,
    MessageType: EncodedDecodeMessageType,
): EncodedMessageAvro {
    const messages = data.messages;
    if (Array.isArray(messages)) {
        const p = new Uint8Array(Uint32Array.from(messages).buffer);
        let d = encodeUint8ArrayToMessages(p, MAXLINELENGTH);
        const b = encodeToAvroBuffer(d, MessageType);
        if (
            b.length < p.length && Array.isArray(d.messages) &&
            d.messages.length < messages.length
        ) {
            console.log(
                "encodeToAvroMessageRecursion success",
                b.length,
                p.length,
            );
            d = encodeToAvroMessageRecursion(
                d,
                MAXLINELENGTH,
                MessageType,
            );
            data.messages = d;

            return data;
        }
        console.log("encodeToAvroMessageRecursion failure", b.length, p.length);
    }

    return data;
}
 */
