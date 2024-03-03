import express from 'express';
import path from 'path';
import * as fs from 'fs';
import * as cheerio from 'cheerio';
import bodyParser from 'body-parser';
import { addDays, getDate, getDay, getMonth, startOfWeek } from 'date-fns';

import { getDateStr } from './utils';
import { MAX_MEMBER_COUNT, MEMBER_LIST_FILE_NAME, TEMPLATE_FILE_NAME, DAYS_IN_WEEK } from './constants';

import type { Request } from 'express';
import type { MemberList, ContentInfo } from './types';

type ContentsJoinReq = {
  nickname: string;
  content: string;
  team: number;
  no?: number;
};

const app = express();
const port = 8000;

app.use(bodyParser.json());

const getDataFilePath = (fileName: string) => {
  return path.resolve(__dirname, `./data/${fileName}`);
};

const getFixtureFilePath = (fileName: string) => {
  return path.resolve(__dirname, `./fixture/${fileName}`);
};

const refineListHtml = ($: cheerio.CheerioAPI, content: string) => {
  return $(`.${content}`)
    .clone()
    .html()
    ?.replace(/<div>/g, '')
    .replace(/<div id=".*">/g, '')
    .replace(/<\/div>/g, '')
    .trim();
};

// 컨텐츠 명단 조회
app.get('/contents/member', (req: Request<{ content: string }>, res) => {
  const { content } = req.query;

  if (typeof content === 'string') {
    const htmlStr = fs.readFileSync(getDataFilePath(MEMBER_LIST_FILE_NAME[content]), 'utf-8');
    const $ = cheerio.load(htmlStr, null, false);
    const listHtml = refineListHtml($, content);

    res.send(listHtml);
  } else {
    res.status(400).send('error');
  }
});

// 컨텐츠 명단 초기화
app.post('/contents/member/init', (req: Request<{ content: string }>, res) => {
  const { content } = req.body;
  const jsonStr = fs.readFileSync(getFixtureFilePath('template_list.json'), 'utf-8');
  const jsonObj = JSON.parse(jsonStr);
  const contentList: ContentInfo[] = jsonObj[content];

  // 존재하는 보스인지 확인
  if (!contentList) {
    return res.send(`${content}은/는 없습니다만!`);
  }

  const templateHtmlStr = fs.readFileSync(getFixtureFilePath(TEMPLATE_FILE_NAME[content]), 'utf-8');
  const $ = cheerio.load(templateHtmlStr, null, false);

  const today = new Date();
  const closestSat = addDays(startOfWeek(today), 5);
  let dateStr = getDateStr(today);

  const newContentList = contentList.map((info, i) => {
    const team = i + 1;
    const targetId = `#${content}-${team}-time`;
    let contentTimeStr = `${content} ${team}팀 명단 ${dateStr} [${info.startTime}]`;

    if (content === '카룻') {
      const date = addDays(closestSat, i);
      const dayStr = DAYS_IN_WEEK[getDay(date)];
      dateStr = getDateStr(date);
      contentTimeStr = `${content} ${dayStr}요일팀 명단 ${dateStr}[${info.startTime}] `;
    }

    $(targetId).empty().append(contentTimeStr);

    return { ...info, date: dateStr };
  });

  const newJson = { ...jsonObj, [content]: newContentList };
  const listHtml = refineListHtml($, content);

  fs.writeFileSync(getDataFilePath('list.json'), JSON.stringify(newJson, null, 2));
  fs.writeFileSync(getDataFilePath(MEMBER_LIST_FILE_NAME[content]), $.html());

  res.send(listHtml);
});

// 컨텐츠 가입
app.post('/contents/member/join', (req: Request<ContentsJoinReq>, res) => {
  const { nickname, content, team, no } = req.body;
  const index = team - 1;
  const fileName = MEMBER_LIST_FILE_NAME[content];

  const jsonStr = fs.readFileSync(getDataFilePath('list.json'), 'utf-8');
  const jsonObj = JSON.parse(jsonStr);
  const contentList: ContentInfo[] = jsonObj[content];

  // 존재하는 보스인지 확인
  if (!contentList) {
    return res.send(`${content}은/는 없습니다만.`);
  }

  // 존재하는 팀인지 확인
  if (!contentList[index]) {
    return res.send(`${content} ${team}팀은 없습니다만.`);
  }

  const memberList: MemberList = contentList[index].members;
  // 꽉 찼는지 확인
  const isMax = memberList.filter(({ nickname }) => nickname).length === MAX_MEMBER_COUNT;
  if (isMax) {
    return res.send(`${content} ${team}팀 꽉 참.`);
  }

  // 중복 확인
  const duplicated = memberList.find((member) => member.nickname === nickname);
  if (duplicated) {
    return res.send(`${nickname}은/는 이미 있음.`);
  }

  // no 확인
  if (no && (no > 10 || no < 1)) {
    return res.send('번호는 1부터 10까지만 작성.');
  }

  // no 자리 비어 있는지 확인
  if (contentList[index].members[no - 1].nickname) {
    return res.send(`${no}번 자리는 이미 있습니다만.`);
  }

  let newNo = no || 1;
  const newList = contentList.map((info: ContentInfo, i: number) => {
    if (i === index) {
      const targetIdx = no ? no - 1 : info.members.findIndex(({ nickname }) => !nickname);
      const newMembers = info.members.map((member, i) => (i === targetIdx ? { ...member, nickname } : member));
      newNo = targetIdx + 1;

      return { ...info, members: newMembers };
    }

    return info;
  });

  const newJson = { ...jsonObj, [content]: newList };
  const htmlStr = fs.readFileSync(getDataFilePath(fileName), 'utf-8');
  const $ = cheerio.load(htmlStr, null, false);
  const targetId = `#${content}-${team}-${newNo}`;

  $(targetId).append(` ${nickname}`);

  const listHtml = refineListHtml($, content);

  fs.writeFileSync(getDataFilePath('list.json'), JSON.stringify(newJson, null, 2));
  fs.writeFileSync(getDataFilePath(fileName), $.html());

  res.send(listHtml);
});

// 컨텐츠 시간 및 날짜 수정
app.post('/contents/edit', (req: Request<{ content: string; team: number; key: string; value: string }>, res) => {
  const { content, team, key, value } = req.body;
  const index = team - 1;

  const jsonStr = fs.readFileSync(getDataFilePath('list.json'), 'utf-8');
  const jsonObj = JSON.parse(jsonStr);
  const contentList: ContentInfo[] = jsonObj[content];
  const fileName = MEMBER_LIST_FILE_NAME[content];

  if (!value) {
    return res.send('수정하려는 값을 같이 작성해 주셔야죠?');
  }

  // 존재하는 보스인지 확인
  if (!contentList) {
    return res.send(`${content}은/는 없습니다만!`);
  }

  // 존재하는 팀인지 확인
  if (!contentList[index]) {
    return res.send(`${content} ${team}팀은 없습니다만!`);
  }

  const htmlStr = fs.readFileSync(getDataFilePath(fileName), 'utf-8');
  const $ = cheerio.load(htmlStr, null, false);
  let newContentList = contentList;

  if (key === '시간') {
    const targetId = `#${content}-${team}-time`;

    newContentList = contentList.map((info, i) => {
      if (i === index) {
        return { ...info, startTime: value };
      }

      return info;
    });

    const newText = $(targetId).text().replace(`${contentList[index].startTime}`, value);
    $(targetId).empty().append(newText);
  } else if (!isNaN(Number(key))) {
    const no = Number(key);
    const targetId = `#${content}-${team}-${no}`;

    newContentList = contentList.map((info, i) => {
      const index = Number(key) - 1;
      const newMemberList = info.members.map((member, j) => (j === no - 1 ? { nickname: value } : member));

      if (i === index) {
        return { ...info, members: newMemberList };
      }

      return info;
    });

    const newText = $(targetId)
      .text()
      .replace(`${contentList[index].members[no - 1].nickname}`, value);
    $(targetId).empty().append(newText);
  }

  const newJson = { ...jsonObj, [content]: newContentList };
  const listHtml = refineListHtml($, content);

  fs.writeFileSync(getDataFilePath('list.json'), JSON.stringify(newJson, null, 2));
  fs.writeFileSync(getDataFilePath(fileName), $.html());

  res.send(listHtml);
});

// 컨텐츠 명단 삭제
app.post('/contents/member/delete', (req: Request<{ content: string; team: number; no: number }>, res) => {
  const { content, team, no } = req.body;
  const index = team - 1;

  const jsonStr = fs.readFileSync(getDataFilePath('list.json'), 'utf-8');
  const jsonObj = JSON.parse(jsonStr);
  const contentList = jsonObj[content];
  const fileName = MEMBER_LIST_FILE_NAME[content];

  // 존재하는 보스인지 확인
  if (!contentList) {
    return res.send(`${content}은/는 없습니다만!`);
  }

  // 존재하는 팀인지 확인
  if (!contentList[index]) {
    return res.send(`${content} ${team}팀은 없습니다만!`);
  }

  let nickname = '';
  const newList = contentList.map((info: ContentInfo, i: number) => {
    if (i === team - 1) {
      const newMembers = info.members.map((member, j) => {
        if (j === no - 1) {
          nickname = member.nickname;

          return { ...member, nickname: '' };
        }
        return member;
      });

      return { ...info, members: newMembers };
    }

    return info;
  });

  const newJson = { ...jsonObj, [content]: newList };
  const htmlStr = fs.readFileSync(getDataFilePath(fileName), 'utf-8');
  const $ = cheerio.load(htmlStr, null, false);
  const targetId = `#${content}-${team}-${no}`;
  const newText = $(targetId).text().replace(` ${nickname}`, '');

  $(targetId).empty().append(newText);

  const listHtml = refineListHtml($, content);

  fs.writeFileSync(getDataFilePath('list.json'), JSON.stringify(newJson, null, 2));
  fs.writeFileSync(getDataFilePath(fileName), $.html());

  res.send(listHtml);
});

app.listen(port, () => {
  console.log(`seed-bot listening on port ${port}`);
});
