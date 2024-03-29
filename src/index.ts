import express from 'express';
import bodyParser from 'body-parser';
import { configDotenv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

import { getInitDateTime, refineContentListRes } from './utils';
import { MAX_MEMBER_COUNT } from './constants';

import type { Request } from 'express';
import type { MemberList } from './types';

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

// 컨텐츠 명단 조회
app.get('/contents/member', async (req: Request<{ content: string }>, res) => {
  const { content } = req.query;

  if (typeof content === 'string') {
    const { data } = await sb
      .from('contents')
      .select('*, members(nickname, no)')
      .eq('name', content)
      .order('id')
      .order('no', { referencedTable: 'members' });
    const contentList = refineContentListRes(content, data as Content[]);

    res.send(contentList);
  } else {
    res.status(400).send('error');
  }
});

// 컨텐츠 명단 초기화
app.post('/contents/member/init', async (req: Request<{}, {}, { content: string }>, res) => {
  const { content } = req.body;

  if (!content) {
    return res.send(`${content}은/는 없어요.`);
  }

  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleString('en-US', { timeZone: 'Asia/Seoul' });
  const today = new Date(formattedDate);

  const { data } = await sb.from('contents').select('team').eq('name', content).order('team');

  data &&
    (await Promise.all(
      data.map(({ team }, i) =>
        sb.from('contents').update(getInitDateTime(today, i)[content]).eq('name', content).eq('team', team)
      )
    ));

  await sb.from('members').update({ nickname: null }).eq('content_name', content);

  const { data: updatedData } = await sb
    .from('contents')
    .select('*, members(nickname, no)')
    .eq('name', content)
    .order('id')
    .order('no', { referencedTable: 'members' });
  const contents = refineContentListRes(content, updatedData as Content[]);

  res.send(contents);
});

// 컨텐츠 가입
app.post('/contents/member/join', async (req: Request<ContentsJoinReq>, res) => {
  const { nickname, content, team, no } = req.body;

  const { data } = await sb
    .from('contents')
    .select('*, members(nickname, no)')
    .eq('name', content)
    .order('id')
    .order('no', { referencedTable: 'members' });
  const targetTeam = data?.find((contentInfo) => contentInfo.team === team);

  // 존재하는 보스인지 확인
  if (!data) {
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

  const isEmpty = no ? !memberList.find((member) => member.no === no)?.nickname : false;
  const firstEmptyNo = memberList.find((member) => !member.nickname)?.no || 0;
  const refinedNo = isEmpty ? no : firstEmptyNo;
  await sb.from('members').update({ nickname }).eq('content_id', targetTeam.id).eq('no', refinedNo);

  const { data: updatedData } = await sb
    .from('contents')
    .select('*, members(nickname, no)')
    .eq('name', content)
    .order('id')
    .order('no', { referencedTable: 'members' });
  const contents = refineContentListRes(content, updatedData as Content[]);

  res.send(contents);
});

// 컨텐츠 시간 및 날짜 수정
app.post('/contents/edit', async (req: Request<{ content: string; team: number; key: string; value: string }>, res) => {
  const { content, team, key, value } = req.body;

  const { data } = await sb
    .from('contents')
    .select('*, members(nickname, no)')
    .eq('name', content)
    .order('id')
    .order('no', { referencedTable: 'members' });
  const targetTeam = data?.find((contentInfo) => contentInfo.team === team);

  if (!value) {
    return res.send('수정하려는 값을 같이 작성해 주셔야죠?');
  }

  // 존재하는 보스인지 확인
  if (!data) {
    return res.send(`${content}은/는 없습니다만!`);
  }

  // 존재하는 팀인지 확인
  if (!targetTeam) {
    return res.send(`${content} ${team}팀은 없습니다만!`);
  }

  if (key === '시간') {
    await sb
      .from('contents')
      .update({ start_time: `${value}:00` })
      .eq('name', content)
      .eq('team', team);
  } else if (!isNaN(Number(key))) {
    const no = Number(key);
    await sb
      .from('members')
      .update({ nickname: value || '' })
      .eq('content_id', targetTeam.id)
      .eq('no', no);
  }

  const { data: updatedData } = await sb
    .from('contents')
    .select('*, members(nickname, no)')
    .eq('name', content)
    .order('id')
    .order('no', { referencedTable: 'members' });
  const contents = refineContentListRes(content, updatedData as Content[]);

  res.send(contents);
});

// 컨텐츠 명단 삭제
app.post(
  '/contents/member/delete',
  async (req: Request<any, any, { content: string; team: number; value: string }>, res) => {
    const { content, team, value } = req.body;

    const { data } = await sb.from('contents').select('*, members(nickname, no)').eq('name', content);
    const targetTeam = data?.find((contentInfo) => contentInfo.team === team);

    // 존재하는 보스인지 확인
    if (!data) {
      return res.send(`${content}은/는 없습니다만!`);
    }

    // 존재하는 팀인지 확인
    if (!targetTeam) {
      return res.send(`${content} ${team}팀은 없습니다만!`);
    }

    const no = Number(value);

    if (!isNaN(no)) {
      await sb.from('members').update({ nickname: null }).eq('content_id', targetTeam.id).eq('no', no);
    } else if (value) {
      await sb.from('members').update({ nickname: null }).eq('content_id', targetTeam.id).eq('nickname', value);
    }

    const { data: updatedData } = await sb
      .from('contents')
      .select('*, members(nickname, no)')
      .eq('name', content)
      .order('id')
      .order('no', { referencedTable: 'members' });
    const contents = refineContentListRes(content, updatedData as Content[]);

    res.send(contents);
  }
);

// 컨텐츠 명단 이동
app.post(
  '/contents/member/shift',
  async (
    req: Request<any, any, { content: string; team: number; value: string; newTeam: number; newNo?: number }>,
    res
  ) => {
    const { content, team, value, newTeam, newNo } = req.body;

    const { data: currentTeamInfo } = await sb
      .from('contents')
      .select('id')
      .eq('name', content)
      .eq('team', team)
      .limit(1);
    const { data: newTeamInfo } = await sb
      .from('contents')
      .select('id, members(nickname, no)')
      .eq('name', content)
      .eq('team', newTeam)
      .order('no', { referencedTable: 'members' })
      .limit(1);

    if (!currentTeamInfo || !currentTeamInfo.length) {
      return res.send(`${content} ${team}팀은 없는데요.`);
    }

    if (!newTeamInfo || !newTeamInfo.length) {
      return res.send(`${content} ${newTeam}팀은 없는데요.`);
    }

    // 이동하려고 하는 팀의 명단이 모두 찬 경우
    const isFull = newTeamInfo[0].members.every(({ nickname }) => nickname);

    if (isFull) {
      return res.send(`${content} ${newTeam}팀은 자리가 없답니다?`);
    }

    const contentId = currentTeamInfo[0].id;
    const newContentId = newTeamInfo[0].id;

    const isEmpty = newNo ? !newTeamInfo[0].members.find((member) => member.no === newNo)?.nickname : false;
    const no = Number(value);
    const emptyNo = newTeamInfo[0].members.find(({ nickname }) => !nickname)?.no || 0;
    const targetNo = isEmpty ? newNo : emptyNo;
    let nickname = '';

    if (!isNaN(no)) {
      const { data } = await sb.from('members').select('nickname').eq('content_id', contentId).eq('no', no).limit(1);

      if (data && data.length) {
        nickname = data[0].nickname;
        await sb.from('members').update({ nickname: null }).eq('content_id', contentId).eq('no', no);
      }
    } else {
      const { data } = await sb
        .from('members')
        .select('nickname')
        .eq('content_id', contentId)
        .eq('nickname', value)
        .limit(1);

      if (data && data.length) {
        nickname = data[0].nickname;
        await sb.from('members').update({ nickname: null }).eq('content_id', contentId).eq('nickname', value);
      }
    }

    if (targetNo && nickname) {
      await sb.from('members').update({ nickname }).eq('content_id', newContentId).eq('no', targetNo);
    }

    const { data: updatedData } = await sb
      .from('contents')
      .select('*, members(nickname, no)')
      .eq('name', content)
      .order('id')
      .order('no', { referencedTable: 'members' });
    const contents = refineContentListRes(content, updatedData as Content[]);

    res.send(contents);
  }
);

app.listen(port, () => {
  console.log(`seed-bot listening on port ${port}`);
});
