import {
  addDays,
  addMinutes,
  format,
  getDate,
  getDay,
  getMonth,
  setHours,
  setMinutes,
  setSeconds,
  startOfWeek,
} from 'date-fns';
import { DATE_FORMAT, DAYS_IN_WEEK, NO_MARK, NO_POSITION, TIME_FORMAT } from '../constants';
import { MemberList } from '../types';

type Content = {
  name: string;
  title: string;
  date: string;
  start_time: string;
  members: MemberList;
};

export const getDateStr = (date: Date) => {
  const month = getMonth(date) + 1;
  const days = getDate(date);
  const dayKor = DAYS_IN_WEEK[getDay(date)];

  return `${month}/${days}(${dayKor})`;
};

export const getInitDateTime = (today: Date, i: number) => {
  const initDateTime: Record<string, { date: string; start_time: string }> = {
    군단: {
      date: format(today, DATE_FORMAT),
      start_time: format(addMinutes(setSeconds(setMinutes(setHours(today, 21), 45), 0), i * 15), TIME_FORMAT),
    },
    카룻: {
      date: format(addDays(startOfWeek(today), 6 + i), DATE_FORMAT),
      start_time: '22:00:00',
    },
  };

  return initDateTime;
};

export const refineContentListRes = (content: string, contentList: Content[]) => {
  let con = '';

  if (content === '군단') {
    con = '‼시간 엄수 늦으면 버립니다‼<br/>';

    contentList?.forEach(({ name, title, date, start_time, members }) => {
      const currDate = new Date(date).toLocaleString('en-US', { timeZone: 'Asia/Seoul' });
      const dateStr = getDateStr(new Date(currDate));
      const startTime = start_time.slice(0, 5);

      con += `🌱 ${title} ${dateStr} [${startTime}]<br/>`;
      members.forEach(({ nickname, no }, i) => {
        con += `${NO_MARK[String(no)]} ${NO_POSITION[String(no)] || ''}${nickname ?? ''}<br/>`;
      });
    });

    con += 'https://discord.com/invite/8vGTYwgQ';
  } else if (content === '카룻') {
    contentList?.forEach(({ name, title, date, start_time, members }) => {
      const currDate = new Date(date).toLocaleString('en-US', { timeZone: 'Asia/Seoul' });
      const dateStr = getDateStr(new Date(currDate));
      const startTime = start_time.slice(0, 5);

      con += `🌷 ${title}팀 ${dateStr} [${startTime}]<br/>`;
      members.forEach(({ nickname, no }, i) => {
        console.log(nickname);
        con += `${NO_MARK[String(no)]} ${NO_POSITION[String(no)] || ''}${nickname ?? ''}<br/>`;
      });
    });
  }

  return con;
};
