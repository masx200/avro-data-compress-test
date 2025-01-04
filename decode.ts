import { Buffer } from "node:buffer";
import { EncodedMessageBigInt } from "./EncodedMessageBigInt.ts";
import { gzipDecompress } from "./gzipDecompress.ts";

import { EncodedMessageLong } from "./EncodedMessageLong.ts";
import { parseEncodedMessageSchema } from "./parseEncodedMessageSchema.ts";
import { bufferToUint8Array } from "./bufferToUint8Array.ts";

async function decodeAvroFile(filePath: string): Promise<EncodedMessageBigInt> {
    // 定义Long类型的处理方式
    const MessageType = parseEncodedMessageSchema();

    const newLocal = await Deno.readFile(filePath);
    // 读取AVRO文件内容
    const buf = Buffer.from(await gzipDecompress(newLocal));

    // 将AVRO二进制数据解析为JavaScript对象
    const decodedMessage: EncodedMessageLong = MessageType.fromBuffer(buf);
    console.log(decodedMessage);
    // 将Map<Long, string>转换为Map<bigint, string>
    const dictionary = new Map<bigint, Uint8Array>();
    for (const [key, value] of Object.entries(decodedMessage.dictionary)) {
        dictionary.set(BigInt(key.toString()), bufferToUint8Array(value));
    }

    // 将Long[][]转换为bigint[][]
    const messages = decodedMessage.messages.map((arr) =>
        arr.map((a) => BigInt(a.toString()))
    );

    return {
        dictionary,
        messages,
    } satisfies EncodedMessageBigInt;
}
if (import.meta.main) {
    const inputfilenames = [
        "input3.avro.gz",
        "input2.avro.gz",
        "input1.avro.gz",
    ];
    const outputfilenames = [
        "input3.txt.raw",
        "input2.txt.raw",
        "input1.txt.raw",
    ];
    for (
        let i = 0;
        i < inputfilenames.length;
        i++
    ) {
        const inputfilename = inputfilenames[i];
        const outputfilename = outputfilenames[i];
        //await (async () => {
        using fsfile = await Deno.open(outputfilename, {
            write: true,
            create: true,
        });
        const decodedData = await decodeAvroFile(inputfilename);
        // console.log(decodedData);
        // const newLocal_1 =
        await Promise.all(decodedData.messages.map((arr) => {
            return (
                arr.map((a) => decodedData.dictionary.get(a)).map(
                    async (a) => {
                        if (a === undefined) {
                            throw new Error("undefined");
                        }
                        await fsfile.write(a);
                    },
                )
                // .join(
                //     "",
                // )
            );
        })); //.join("\n");
        // decodedData.messages.map((arr) => {
        //     console.log(
        //         arr.map((a) => decodedData.dictionary.get(a)).join(" "),
        //     );
        // });
        // await Deno.writeFile(
        //     outputfilename,
        //     newLocal_1,
        // );
        //  })();
    }
    // 示例调用
}
