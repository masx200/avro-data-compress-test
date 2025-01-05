export function bufferToUint8Array(buffer: Buffer<Uint8Array>): Uint8Array {
    //@ts-ignore
    const uint8Array = new Uint8Array(buffer.length);
    //@ts-ignore
    for (let i = 0; i < buffer.length; i++) {
        //@ts-ignore
        uint8Array[i] = buffer[i];
    }
    return new Uint8Array(uint8Array);
}
import { Buffer } from "node:buffer";
