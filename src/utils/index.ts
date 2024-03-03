import { getDate, getDay, getMonth } from 'date-fns';
import { DAYS_IN_WEEK } from '../constants';

export const getDateStr = (date: Date) => {
  const month = getMonth(date) + 1;
  const days = getDate(date);
  const dayKor = DAYS_IN_WEEK[getDay(date)];

  return `${month}/${days}(${dayKor})`;
};
