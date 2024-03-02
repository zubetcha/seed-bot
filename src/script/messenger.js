const BASE_URL = 'https://seed-bot-zubetcha.koyeb.app';

const getGundanList = () => {
  let json;
  let result;
  try {
    let response = org.jsoup.Jsoup.connect(BASE_URL + '/gundan')
      .header('Content-Type', 'application/json')
      .ignoreContentType(true)
      .ignoreHttpErrors(true)
      .get();

    result = response.text();
  } catch (e) {
    result = e;
    Log.e(e);
  }

  return result.replace(/<br\s*\/?>/gi, '\r\n');
};

const getCharutList = () => {
  let json;
  let result;
  try {
    let response = org.jsoup.Jsoup.connect(BASE_URL + '/charut')
      .header('Content-Type', 'application/json')
      .ignoreContentType(true)
      .ignoreHttpErrors(true)
      .get();

    result = response.text();
  } catch (e) {
    result = e;
    Log.e(e);
  }
  return result;
};

function response(room, msg, sender, isGroupChat, replier, imageDB, packazgeName) {
  if (!msg.startsWith('!')) {
    return;
  }

  const [cmd, boss, time] = msg.trim().split(' ');

  if (cmd === '!명단') {
    const fetcher = {
      군단: getGundanList,
      카룻: getCharutList,
    };

    const list = fetcher[boss]();

    Log.i(list);
    replier.reply(room, list);
  }

  if (cmd === '!가입') {
    const bossStr = {
      군단: '군단',
      카룻: '카룻',
    };

    replier.reply(bossStr[boss]);
  }

  if (cmd === '!수정') {
  }
}
