const BASE_URL = process.env.BASE_URL;
const LIST_GUNDAN = 'gundan_list.txt';
const TEMPLATE_GUNDAN = 'gundan_template.txt';

const getGundanList = async () => {
  const res = await fetch(`${BASE_URL}/gundan`);
  return res.text();
};

const getCharutList = async () => {
  const res = await fetch(`${BASE_URL}/charut`);
  return res.text();
};

function response(room, msg, sender, isGroupChat, replier, imageDB, packazgeName) {
  // 모든 채팅 알림에 대해 메시지 원본 그대로 답장하는 기능

  if (!msg.startsWith('!')) {
    return;
  }

  const [cmd, boss, time] = msg.trim().split(' ');

  if (cmd === '!명단') {
    const fetcher = {
      군단: getGundanList,
      카룻: getCharutList,
    };

    let list;

    fetcher[boss]?.().then((result) => {
      list = result;
    });

    replier.reply(list);
  }

  if (cmd === '!가입') {
    const bossStr = {
      군단: '군단',
      카룻: '카룻',
    };

    replier.reply(bossStr[boss]);
  }

  if (msg.startsWith('!명단')) {
    let list;

    if (msg.includes('군단')) {
    }
  }

  if (msg.startsWith('!군단')) {
    replier.reply('군단');
  }

  if (msg.startsWith('!카룻')) {
    replier.reply('카룻');
  }
}
