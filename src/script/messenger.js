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

const initContent = (content) => {
  let json;
  let result;
  try {
    let response = org.jsoup.Jsoup.connect(BASE_URL + '/contents/member/init')
      .header('Content-Type', 'application/json')
      .data('content', content)
      .ignoreContentType(true)
      .ignoreHttpErrors(true)
      .post();

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

const joinContent = ({ nickname, content, team, no }) => {
  let json;
  let result;
  try {
    let response = org.jsoup.Jsoup.connect(BASE_URL + '/contents/member/join')
      .header('Content-Type', 'application/json')
      .data('nickname', nickname)
      .data('content', content)
      .data('team', team)
      .data('no', no ?? null)
      .ignoreContentType(true)
      .ignoreHttpErrors(true)
      .post();

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

const editContentInfo = ({ content, team, key, value }) => {
  let json;
  let result;
  try {
    let response = org.jsoup.Jsoup.connect(BASE_URL + '/contents/edit')
      .header('Content-Type', 'application/json')
      .data('content', content)
      .data('team', team)
      .data('key', key)
      .data('value', value)
      .ignoreContentType(true)
      .ignoreHttpErrors(true)
      .post();

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

const deleteMember = () => {
  let json;
  let result;
  try {
    let response = org.jsoup.Jsoup.connect(BASE_URL + '/contents/member/delete')
      .header('Content-Type', 'application/json')
      .data('content', content)
      .data('team', team)
      .data('no', no)
      .ignoreContentType(true)
      .ignoreHttpErrors(true)
      .post();

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

  const [cmd, content, team, key, value] = msg.trim().split(' ');

  if (cmd === '!명단') {
    const list = getContentsMemberList(content);

    Log.i(list);
    replier.reply(room, list);
  }

  if (cmd === '!초기화') {
    const list = initContent(content);

    Log.i(list);
    replier.reply(room, list);
  }

  if (cmd === '!가입') {
    const data = {
      nickname: key ?? sender,
      content,
      team: Number(team),
      no: Number(value),
    };
    const list = joinContent(data);

    Log.i(list);
    replier.reply(room, list);
  }

  if (cmd === '!수정') {
    const data = {
      content,
      team: Number(team),
      key,
      value,
    };
    const list = editContentInfo(data);

    Log.i(list);
    replier.reply(room, list);
  }

  if (cmd === '!탈퇴') {
    const data = {
      content,
      team: Number(team),
      no: Number(key),
    };
    const list = deleteMember(data);

    Log.i(list);
    replier.reply(room, list);
  }
}
