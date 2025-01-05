import { createHash } from "node:crypto";

export function calculateSHA512(data: Uint8Array[]): string {
    const hash = createHash("sha512");
    data.forEach((d) => hash.update(d));
    return hash.digest("hex");
}
