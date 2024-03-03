const BASE_URL = 'https://seed-bot-zubetcha.koyeb.app';

const getContentsMemberList = (content) => {
  let json;
  let result;
  try {
    let response = org.jsoup.Jsoup.connect(BASE_URL + '/contents/member')
      .header('Content-Type', 'application/json')
      .data('content', content)
      .ignoreContentType(true)
      .ignoreHttpErrors(true)
      .get();

    result = org.jsoup.Jsoup.parse(response.html())
      .body()
      .html()
      .replace(/<br\s*\/?>/gi, '');
  } catch (e) {
    result = e;
    Log.e(e);
  }

  return result;
};

const joinContents = ({ nickname, content, order }) => {
  let json;
  let result;
  try {
    let response = org.jsoup.Jsoup.connect(BASE_URL + '/contents/member')
      .header('Content-Type', 'application/json')
      .data('content', content)
      .ignoreContentType(true)
      .ignoreHttpErrors(true)
      .get();

    result = org.jsoup.Jsoup.parse(response.html())
      .body()
      .html()
      .replace(/<br\s*\/?>/gi, '');
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

  const [cmd, content, time] = msg.trim().split(' ');

  if (cmd === '!명단') {
    const list = getContentsMemberList(content);

    Log.i(list);
    replier.reply(room, list);
  }

  if (cmd === '!가입') {
    const contentStr = {
      군단: '군단',
      카룻: '카룻',
    };

    replier.reply(contentStr[content]);
  }

  if (cmd === '!수정') {
  }
}
