declare class RKError extends Error {
    static UNKNOWN: number;
    static TIMEOUT: number;
    static NO_SESSION: number;
    constructor(type: number);
}
export default RKError;
