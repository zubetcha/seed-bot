"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class RKError extends Error {
    static UNKNOWN = 0;
    static TIMEOUT = 1;
    static NO_SESSION = 2;
    constructor(type) {
        super(Object.entries(RKError)
            .find(([, code]) => code === type)?.[0]
            .toString() ?? 'UNKNOWN');
        this.name = 'RKError';
    }
}
exports.default = RKError;
