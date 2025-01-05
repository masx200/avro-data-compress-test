import { Buffer } from "node:buffer";

export function ObjectToArray(
    arg0: Array<[string, Uint8Array]>,
): (Buffer<Uint8Array>)[] {
    const array: (Buffer<Uint8Array>)[] = [];
    array.length = Object.keys(arg0).length;
    array.fill(Buffer.alloc(0));
    arg0.forEach((key) => {
        array[Number(key[0])] = Buffer.from(key[1]);
    });
    return array;
}
