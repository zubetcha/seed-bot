import express from 'express';
import path from 'path';
import * as fs from 'fs';
import * as cheerio from 'cheerio';
import bodyParser from 'body-parser';
import { configDotenv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { addDays, format, getDate, getDay, getMonth, startOfWeek } from 'date-fns';

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

type Content = {
  name: string;
  title: string;
  date: string;
  start_time: string;
  members: MemberList;
};

configDotenv();
const app = express();
const port = process.env.PORT;

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

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
    .replace(/<\/div>/g, '<br>')
    .trim();
};

const refineResContent = (content: string, contentList: Content[]) => {
  let con = '';
  console.log(JSON.stringify(contentList));

  if (content === '군단') {
    con = '‼시간 엄수 늦으면 버립니다‼\n';

    contentList?.forEach(({ name, title, date, start_time, members }) => {
      const sortedMembers = members.sort((a, b) => a.no - b.no);
      const currDate = new Date(date).toLocaleString('en-US', { timeZone: 'Asia/Seoul' });
      const dateStr = getDateStr(new Date(currDate));
      const startTime = start_time.slice(0, 5);

      con += `🌱 ${title} ${dateStr} [${startTime}]`;
      con += '\n';
      new Array(10).fill(1).forEach((num, i) => {
        con += `${num + i}. ${members[i].nickname ? members[i].nickname : ''}`;
        con += '\n';
      });
    });

    con += 'https://discord.com/invite/8vGTYwgQ';
  }

  return con;
};

// 컨텐츠 명단 조회
app.get('/contents/member', async (req: Request<{ content: string }>, res) => {
  const { content } = req.query;

  if (typeof content === 'string') {
    const htmlStr = fs.readFileSync(getDataFilePath(MEMBER_LIST_FILE_NAME[content]), 'utf-8');
    const $ = cheerio.load(htmlStr, null, false);
    const listHtml = refineListHtml($, content);

    // REVIEW: sb 리팩토링
    const { data } = await sb.from('contents').select('*, members(nickname, no)').eq('name', content);
    const contentList = refineResContent(content, data as Content[]);

    res.send(contentList);
  } else {
    res.status(400).send('error');
  }
});

// 컨텐츠 명단 초기화
app.post('/contents/member/init', async (req: Request<{ content: string }>, res) => {
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

  // 현재 시간대의 날짜를 가져오기
  const currentDate = new Date();

  // 특정 타임존의 날짜 문자열로 변환
  const formattedDate = currentDate.toLocaleString('en-US', { timeZone: 'Asia/Seoul' });

  // 변환된 문자열을 Date 객체로 파싱
  const today = new Date(formattedDate);

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

  // REVIEW: sb 리팩토링
  // contents 날짜, 시간 초기화
  if (content === '군단') {
    await sb.from('contents').update({}).eq('name', content);
  } else if (content === '카룻') {
  }

  await sb.from('members').update({ nickname: null }).eq('content_name', content);

  const { data } = await sb.from('contents').select('*, members(nickname, no)').eq('name', content);
  const contents = refineResContent(content, data as Content[]);

  res.send(contents);
});

// 컨텐츠 가입
app.post('/contents/member/join', async (req: Request<ContentsJoinReq>, res) => {
  const { nickname, content, team, no } = req.body;
  const index = team - 1;
  const fileName = MEMBER_LIST_FILE_NAME[content];

  const jsonStr = fs.readFileSync(getDataFilePath('list.json'), 'utf-8');
  const jsonObj = JSON.parse(jsonStr);
  const contentList: ContentInfo[] = jsonObj[content];

  // REVIEW: sb 리팩토링
  const { data } = await sb.from('contents').select('*, members(nickname, no)').eq('name', content);
  const targetTeam = data?.find((contentInfo) => contentInfo.team === team);
  const contents = refineResContent(content, data as Content[]);

  // 존재하는 보스인지 확인
  if (!contents?.length) {
    return res.send(`${content}은/는 없습니다만.`);
  }

  // 존재하는 팀인지 확인
  if (!targetTeam) {
    return res.send(`${content} ${team}팀은 없습니다만.`);
  }

  const memberList: MemberList = targetTeam.members;
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
  const hasMember = !!memberList.find((member) => member.no == no)?.nickname;
  if (no && hasMember) {
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

  await sb.from('members').update;

  res.send(data);
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

    // newContentList = contentList.map((info, i) => {
    //   const index = Number(key) - 1;
    //   const newMemberList = info.members.map((member, j) => (j === no - 1 ? { nickname: value } : member));

    //   if (i === index) {
    //     return { ...info, members: newMemberList };
    //   }

    //   return info;
    // });

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
app.post('/contents/member/delete', (req: Request<{ content: string; team: number; nicknameOrNo: string }>, res) => {
  const { content, team, nicknameOrNo } = req.body;
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

  let no = 0;
  let nickname = '';
  const newList = contentList.map((info: ContentInfo, i: number) => {
    if (i === index) {
      const newMembers = info.members.map((member, j) => {
        if (j === Number(nicknameOrNo) - 1 || member.nickname === nicknameOrNo) {
          no = j + 1;
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
