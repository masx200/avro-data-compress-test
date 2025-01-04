export function gzipCompress(input: Uint8Array): Promise<Uint8Array> {
    return new Promise<Uint8Array>((resolve, reject) => {
        async function processText(
            { done, value }: ReadableStreamReadResult<Uint8Array>,
        ): Promise<void> {
            if (done) {
                resolve(new Uint8Array(compressedData));
                return;
            }
            compressedData = compressedData.concat(Array.from(value));
            return await reader.read().then(processText);
        }
        const compressionStream = new CompressionStream("gzip");

        const writer = compressionStream.writable.getWriter();
        writer.write(input);
        writer.close();

        const reader = compressionStream.readable.getReader();
        let compressedData: number[] = [];
        reader.read().then(processText).catch(reject);
    });
}
