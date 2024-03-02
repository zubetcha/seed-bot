import { Message, UDPServer } from '.';
import { Config } from './types';
export declare abstract class RKPlugin {
    server: UDPServer;
    config?: Config;
    log: (text: any) => void;
    constructor(server: UDPServer, config?: Config);
    extendServerClass?(server: UDPServer): Promise<UDPServer> | UDPServer;
    extendMessageClass?(message: Message): Promise<Message> | Message;
    onReady?(port: number): Promise<void> | void;
    onMessage?(message: Message): Promise<void> | void;
}
