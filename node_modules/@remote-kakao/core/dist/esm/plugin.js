import { rkPluginLog } from '.';
export class RKPlugin {
    server;
    config;
    log;
    constructor(server, config) {
        this.server = server;
        this.config = config;
        this.log = (text) => {
            rkPluginLog(this.constructor.name, text.toString());
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
