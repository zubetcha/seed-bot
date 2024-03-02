"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RKPlugin = void 0;
const _1 = require(".");
class RKPlugin {
    server;
    config;
    log;
    constructor(server, config) {
        this.server = server;
        this.config = config;
        this.log = (text) => {
            (0, _1.rkPluginLog)(this.constructor.name, text.toString());
        };
    }
    extendServerClass(server) {
        return server;
    }
    extendMessageClass(message) {
        return message;
    }
    onReady(port) { }
    onMessage(message) { }
}
exports.RKPlugin = RKPlugin;
