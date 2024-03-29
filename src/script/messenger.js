const BASE_URL = 'SERVEL';

const getContentStr = (response) => {
  const content = org.jsoup.Jsoup.parse(response.html())
    .body()
    .html()
    .replace(/<br\s*\/?>/gi, '')
    .trim();

  return content;
};

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

    result = getContentStr(response);
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

    result = getContentStr(response);
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

    result = getContentStr(response);
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

    result = getContentStr(response);
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

    result = getContentStr(response);
  } catch (e) {
    result = e;
    Log.e(e);
  }

  return result;
};

const shiftMember = (data) => {
  let json;
  let result;

  try {
    let response = org.jsoup.Jsoup.connect(BASE_URL + '/contents/member/shift')
      .header('Content-Type', 'application/json')
      .requestBody(JSON.stringify(data))
      .ignoreContentType(true)
      .ignoreHttpErrors(true)
      .post();

    result = getContentStr(response);
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

  const [cmd, content, team, key, value, sixth] = msg.trim().split(' ');

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
      value: key,
    };
    const filteredMemberList = deleteMember(deleteData);

    Log.i(filteredMemberList);
    replier.reply(room, filteredMemberList);
  }

  if (cmd === '!이동') {
    const shiftData = {
      content: content,
      team: Number(team),
      value: key,
      newTeam: Number(value),
      newNo: sixth ? Number(sixth) : 0,
    };

    const shiftedMemberList = shiftMember(shiftData);

    Log.i(shiftedMemberList);
    replier.reply(room, shiftedMemberList);
  }
}
