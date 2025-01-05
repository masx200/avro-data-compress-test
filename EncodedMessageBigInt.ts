export type EncodedMessageBigInt = {
    dictionary: Map<bigint, Uint8Array>;
    messages: bigint[];
    haveAvroData: number;
    sha512: string;
};
