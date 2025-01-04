export function splitUint8ArrayIntoChunks(
    str: Uint8Array,
    chunkSize: number,
): Uint8Array[] {
    if (chunkSize <= 0) {
        throw new Error("Chunk size must be greater than 0");
    }
    const results: Uint8Array[] = [];

    for (let i = 0; i < str.length; i += chunkSize) {
        const newLocal = str.subarray(i, i + chunkSize);
        // chunks.push(str.substring(i, i + chunkSize));

        results.push(Uint8Array.from(newLocal));
    }

    return results;
}
