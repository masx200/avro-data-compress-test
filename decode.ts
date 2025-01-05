import { Buffer } from "node:buffer";
import { EncodedMessageBigInt } from "./EncodedMessageBigInt.ts";
import { gzipDecompress } from "./gzipDecompress.ts";

import { bufferToUint8Array } from "./bufferToUint8Array.ts";
import { EncodedMessageAvro } from "./EncodedMessageAvro.ts";
import { parseEncodedMessageSchema } from "./parseEncodedMessageSchema.ts";

async function decodeAvroFile(filePath: string): Promise<EncodedMessageBigInt> {
    // 定义Long类型的处理方式
    const MessageType = parseEncodedMessageSchema();

    const newLocal = await Deno.readFile(filePath);
    // 读取AVRO文件内容
    const buf = Buffer.from(await gzipDecompress(newLocal));

    // 将AVRO二进制数据解析为JavaScript对象
    const decodedMessage: EncodedMessageAvro = MessageType.fromBuffer(buf);
    console.log(decodedMessage);
    // 将Map<Long, string>转换为Map<bigint, string>
    const dictionary = new Map<bigint, Uint8Array>();
    for (const [key, value] of Object.entries(decodedMessage.dictionary)) {
        dictionary.set(BigInt(key.toString()), bufferToUint8Array(value));
    }

    // 将Long[][]转换为bigint[][]
    const messages = decodedMessage.messages.map((arr) =>
        BigInt(arr.toString())
    );

    return {
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
        //await (async () => {
        using fsfile = await Deno.open(outputfilename, {
            write: true,
            create: true,
        });
        const decodedData = await decodeAvroFile(inputfilename);
        // console.log(decodedData);
        // const newLocal_1 =
        await Promise.all(decodedData.messages.map(async (arr) => {
            const newLocal_1 = decodedData.dictionary.get(arr);

            if (newLocal_1 === undefined) {
                throw new Error("undefined");
            }
            await fsfile.write(newLocal_1);
        }) // .join(
            //     "",
            // )
        );
        // })); //.join("\n");
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
