const LIST_GUNDAN = 'gundan_list.txt';
const TEMPLATE_GUNDAN = 'gundan_template.txt';

function response(room, msg, sender, isGroupChat, replier, imageDB, packazgeName) {
  // 모든 채팅 알림에 대해 메시지 원본 그대로 답장하는 기능

  if (!msg.startsWith('!')) {
    return;
  }

  if (msg.startsWith('!군단')) {
    const gundanList = DataBase.getDataBase(LIST_GUNDAN);

    replier.reply(gundanList);
  }

  if (msg.startsWith('!카룻')) {
  }
}
