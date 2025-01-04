export function gzipDecompress(
    compressedData: Uint8Array,
): Promise<Uint8Array> {
    return new Promise<Uint8Array>((resolve, reject) => {
        async function processText(
            { done, value }: ReadableStreamReadResult<Uint8Array>,
        ): Promise<void> {
            if (done) {
                resolve(new Uint8Array(decompressedData));
                return;
            }
            decompressedData = decompressedData.concat(Array.from(value));
            return await reader.read().then(processText);
        }
        const decompressionStream = new DecompressionStream("gzip");
        const writer = decompressionStream.writable.getWriter();
        const uint8Array = new Uint8Array(compressedData);
        writer.write(uint8Array);
        writer.close();

        const reader = decompressionStream.readable.getReader();
        let decompressedData: number[] = [];
        reader.read().then(processText).catch(reject);
    });
}
