import { createGzip } from "zlib";
import stream, { PassThrough } from "stream";
import { Buffer } from "node:buffer";
import { bufferToUint8Array } from "./bufferToUint8Array.ts";
const { pipeline } = stream.promises;
export async function gzipCompress(input: Uint8Array): Promise<Uint8Array> {
    const gzip = createGzip();
    const pass = new PassThrough();
    const chunks: Uint8Array[] = [];

    // 将 Uint8Array 数据写入到 PassThrough 流中
    pass.end(input);

    // 使用 pipeline 处理流并收集输出

    gzip.on("data", (chunk) => chunks.push(chunk));
    await Promise.all([
        pipeline(pass, gzip),
        new Promise((resolve, reject) => {
            gzip.on("end", resolve);
            gzip.on("error", reject);
        }),
    ]);
    // 合并所有分块成一个 Uint8Array
    return bufferToUint8Array(Buffer.concat(chunks));
}
