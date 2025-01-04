export function splitStringIntoChunks(
    str: string,
    chunkSize: number,
): string[] {
    if (chunkSize <= 0) {
        throw new Error("Chunk size must be greater than 0");
    }

    const chunks: string[] = [];
    for (let i = 0; i < str.length; i += chunkSize) {
        chunks.push(str.substring(i, i + chunkSize));
    }

    return chunks;
}
