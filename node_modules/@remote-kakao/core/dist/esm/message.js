export class Message {
    #server;
    address;
    room;
    id;
    sender;
    content;
    containsMention;
    time;
    app;
    constructor(server, info, data) {
        const self = this;
        this.#server = server;
        this.address = info;
        this.room = {
            name: data.room.name,
            id: data.room.id,
            isGroupChat: data.room.isGroupChat,
            get icon() {
                return self.#server.getRoomIcon(self.address, self.app.userId, self.app.packageName, self.room.id);
            },
        };
        this.id = data.id;
        this.sender = {
            name: data.sender.name,
            hash: data.sender.hash,
            get profileImage() {
                return self.#server.getProfileImage(self.address, self.app.userId, self.app.packageName, self.room.id);
            },
        };
        this.content = data.content;
        this.containsMention = data.containsMention;
        this.time = data.time;
        this.app = {
            packageName: data.app.packageName,
            userId: data.app.userId,
        };
    }
    replyText(text, timeout = 60000) {
        return this.#server.sendText(this.address, this.app.userId, this.app.packageName, this.room.id, text, timeout);
    }
    markAsRead(timeout = 60000) {
        return this.#server.markAsRead(this.address, this.app.userId, this.app.packageName, this.room.id, timeout);
    }
}
