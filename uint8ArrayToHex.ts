export function uint8ArrayToHex(data: Uint8Array): string {
    return Array.from(data).map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
}
