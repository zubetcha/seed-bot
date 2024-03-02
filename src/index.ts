import { UDPServer } from '@remote-kakao/core';
import LoggerPlugin from './plugins/logger';

const prefix = '>';
const server = new UDPServer();

server.usePlugin(LoggerPlugin); //플러그인 추가

server.on('message', async (msg) => {
  if (!msg.content.startsWith(prefix)) return;

  const args = msg.content.split(' ');
  const cmd = args.shift()?.slice(prefix.length);

  if (cmd === 'ping') {
    /*
      메신저봇과 카카오톡 서버간의 핑이 아닌,
      Node.js와 메신저봇간의 핑입니다.
    */
    const timestamp = Date.now();
    await msg.replyText('Pong!');
    msg.replyText(`${Date.now() - timestamp}ms`);
  }
});

server.start(8000);
