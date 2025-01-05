export type EncodedMessageBigInt = {
    dictionary: Map<bigint, Uint8Array>;
    messages: bigint[];
    // haveAvroData: boolean;
    sha512: string;
};
