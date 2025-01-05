import { createHash } from "node:crypto";

export function calculateSHA512(data: Uint8Array): string {
    const hash = createHash("sha512");
    hash.update(data);
    return hash.digest("hex");
}
