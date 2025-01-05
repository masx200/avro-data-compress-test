export interface EncodedMessageBigInt {
    dictionary: Map<bigint, Uint8Array>;
    messages: bigint[];
    haveAvroData: boolean;
}
