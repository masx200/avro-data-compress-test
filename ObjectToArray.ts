import { Buffer } from "node:buffer";

export function ObjectToArray(
    arg0: { [k: string]: Uint8Array },
): (Buffer<Uint8Array>)[] {
    const array: (Buffer<Uint8Array>)[] = [];
    array.length = Object.keys(arg0).length;
    array.fill(Buffer.alloc(0));
    Object.keys(arg0).forEach((key) => {
        array[Number(key)] = Buffer.from(arg0[key]);
    });
    return array;
}
