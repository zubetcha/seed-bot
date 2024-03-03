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

const initContent = (data) => {
  let json;
  let result;
  try {
    let response = org.jsoup.Jsoup.connect(BASE_URL + '/contents/member/init')
      .header('Content-Type', 'application/json')
      .requestBody(JSON.stringify(data))
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

const joinContent = (data) => {
  let json;
  let result;

  try {
    let response = org.jsoup.Jsoup.connect(BASE_URL + '/contents/member/join')
      .header('Content-Type', 'application/json')
      .requestBody(JSON.stringify(data))
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

const editContentInfo = (data) => {
  let json;
  let result;

  try {
    let response = org.jsoup.Jsoup.connect(BASE_URL + '/contents/edit')
      .header('Content-Type', 'application/json')
      .requestBody(JSON.stringify(data))
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

const deleteMember = (data) => {
  let json;
  let result;

  try {
    let response = org.jsoup.Jsoup.connect(BASE_URL + '/contents/member/delete')
      .header('Content-Type', 'application/json')
      .requestBody(JSON.stringify(data))
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
    const memberList = getContentsMemberList(content);

    Log.i(memberList);
    replier.reply(room, memberList);
  }

  if (cmd === '!초기화') {
    const initData = {
      content: content,
    };
    const inittedMemberList = initContent(initData);

    Log.i(inittedMemberList);
    replier.reply(room, inittedMemberList);
  }

  if (cmd === '!가입') {
    const no = Number(value);
    const joinData = {
      nickname: key ? key : sender,
      content: content,
      team: Number(team),
      no: no ? no : null,
    };
    const newMemberList = joinContent(joinData);

    Log.i(newMemberList);
    replier.reply(room, newMemberList);
  }

  if (cmd === '!수정') {
    const editData = {
      content: content,
      team: Number(team),
      key: key,
      value: value,
    };
    const modifiedMemberList = editContentInfo(editData);

    Log.i(modifiedMemberList);
    replier.reply(room, modifiedMemberList);
  }

  if (cmd === '!탈퇴') {
    const deleteData = {
      content: content,
      team: Number(team),
      no: Number(key),
    };
    const filteredMemberList = deleteMember(deleteData);

    Log.i(filteredMemberList);
    replier.reply(room, filteredMemberList);
  }
}
