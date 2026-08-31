import type { WeekPlan } from '../types/planner';

const monthsMap: Record<string, number> = {
  'Gen': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'Mag': 4, 'Giu': 5, 'Lug': 6, 'Ago': 7, 'Set': 8, 'Ott': 9, 'Nov': 10, 'Dic': 11,
  'gen': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'mag': 4, 'giu': 5, 'lug': 6, 'ago': 7, 'set': 8, 'ott': 9, 'nov': 10, 'dic': 11
};

export const isDayInPast = (dateLabel: string): boolean => {
  const todayDate = new Date();
  const todayPure = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
  
  const monthsShort = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
  const isToday = dateLabel === `${todayDate.getDate()} ${monthsShort[todayDate.getMonth()]}`;
  if (isToday) return false;

  const dateParts = dateLabel.split(' ');
  const dNum = parseInt(dateParts[0]);
  const mStr = dateParts[1];
  if (!dNum || !mStr) return false;
  const mNum = monthsMap[mStr];
  if (mNum === undefined) return false;

  const currentYear = todayDate.getFullYear();
  const dayPure = new Date(currentYear, mNum, dNum);
  return dayPure < todayPure;
};

export const isWeekInPast = (week: WeekPlan): boolean => {
  if (!week || !week.days || week.days.length === 0) return false;
  return week.days.every(day => isDayInPast(day.dateLabel));
};
