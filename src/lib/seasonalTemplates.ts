import { STUDIO_TEMPLATES } from '@/lib/studio/constants';

export type SeasonId =
  | 'easter'
  | 'christmas'
  | 'thanksgiving'
  | 'newyear'
  | 'mothers_day'
  | 'fathers_day'
  | 'back_to_school'
  | 'special_series';

export type SeasonalTemplate = {
  id: string;
  season: SeasonId;
  name: string;
  desc: string;
  color: string;
  textShadow: string;
  fontStyle: 'normal' | 'italic';
  overlay?: string;
  hashtags: string[];
  socialCaption: string;
  prominenceStart: string;
  prominenceEnd: string;
};

export const SEASONAL_TEMPLATES: SeasonalTemplate[] = [
  {
    id: 'easter_glory',
    season: 'easter',
    name: 'Easter Glory',
    desc: 'Purple and gold resurrection palette.',
    color: '#E9D5FF',
    textShadow: '0 0 24px rgba(167,139,250,0.9)',
    fontStyle: 'normal',
    overlay: 'linear-gradient(180deg, rgba(76,29,149,0.35), transparent)',
    hashtags: ['#Easter2025', '#HeIsRisen', '#ResurrectionSunday'],
    socialCaption: 'He is risen! Share this moment from Sunday.',
    prominenceStart: '03-15',
    prominenceEnd: '04-30',
  },
  {
    id: 'christmas_advent',
    season: 'christmas',
    name: 'Advent Candlelight',
    desc: 'Deep red, green, and gold Christmas aesthetic.',
    color: '#FDE68A',
    textShadow: '0 4px 18px rgba(127,29,29,0.95)',
    fontStyle: 'italic',
    overlay: 'linear-gradient(180deg, rgba(127,29,29,0.4), rgba(6,78,59,0.25))',
    hashtags: ['#Advent2025', '#ChristmasAtChurch', '#HopeHasCome'],
    socialCaption: 'A word of hope for the season.',
    prominenceStart: '11-15',
    prominenceEnd: '12-31',
  },
  {
    id: 'thanksgiving_gratitude',
    season: 'thanksgiving',
    name: 'Grateful Hearts',
    desc: 'Warm amber and brown Thanksgiving tones.',
    color: '#FCD34D',
    textShadow: '0 2px 16px rgba(120,53,15,0.85)',
    fontStyle: 'normal',
    overlay: 'linear-gradient(180deg, rgba(120,53,15,0.35), transparent)',
    hashtags: ['#Thankful', '#Gratitude', '#ThanksgivingSermon'],
    socialCaption: 'Give thanks with us this season.',
    prominenceStart: '11-01',
    prominenceEnd: '11-30',
  },
  {
    id: 'newyear_vision',
    season: 'newyear',
    name: 'Vision Sunday',
    desc: 'Dark canvas with gold forward-looking accents.',
    color: '#FDE047',
    textShadow: '0 0 28px rgba(234,179,8,0.75)',
    fontStyle: 'normal',
    overlay: 'linear-gradient(180deg, rgba(0,0,0,0.55), transparent)',
    hashtags: ['#VisionSunday', '#NewYearNewSeason', '#ForwardInFaith'],
    socialCaption: 'Step into what God is doing this year.',
    prominenceStart: '12-26',
    prominenceEnd: '01-31',
  },
  {
    id: 'mothers_day_warm',
    season: 'mothers_day',
    name: 'Mother\'s Day Blessing',
    desc: 'Soft warm tones for Mother\'s Day.',
    color: '#FECDD3',
    textShadow: '0 2px 12px rgba(190,24,93,0.6)',
    fontStyle: 'normal',
    hashtags: ['#MothersDay', '#BlessedMom', '#ChurchFamily'],
    socialCaption: 'Honoring the mothers in our church family.',
    prominenceStart: '04-25',
    prominenceEnd: '05-15',
  },
  {
    id: 'fathers_day_warm',
    season: 'fathers_day',
    name: 'Father\'s Day Honor',
    desc: 'Warm steady tones for Father\'s Day.',
    color: '#BFDBFE',
    textShadow: '0 2px 12px rgba(30,64,175,0.65)',
    fontStyle: 'normal',
    hashtags: ['#FathersDay', '#FaithfulFathers', '#ChurchFamily'],
    socialCaption: 'Celebrating faithful fathers in our community.',
    prominenceStart: '06-01',
    prominenceEnd: '06-22',
  },
  {
    id: 'back_to_school',
    season: 'back_to_school',
    name: 'Back to School Sunday',
    desc: 'Energetic palette for a new school year.',
    color: '#67E8F9',
    textShadow: '0 0 20px rgba(14,116,144,0.75)',
    fontStyle: 'normal',
    hashtags: ['#BackToSchoolSunday', '#PrayForStudents', '#NewSeason'],
    socialCaption: 'Praying over students and families this season.',
    prominenceStart: '08-01',
    prominenceEnd: '09-15',
  },
  {
    id: 'special_series',
    season: 'special_series',
    name: 'Special Series',
    desc: 'Configurable palette for church series branding.',
    color: '#C4B5FD',
    textShadow: '0 0 24px rgba(139,92,246,0.65)',
    fontStyle: 'normal',
    hashtags: ['#ChurchSeries', '#SermonSeries'],
    socialCaption: 'Catch the full series — link in bio.',
    prominenceStart: '01-01',
    prominenceEnd: '12-31',
  },
];

function isInProminenceWindow(now: Date, startMd: string, endMd: string) {
  const year = now.getFullYear();
  const [sm, sd] = startMd.split('-').map(Number);
  const [em, ed] = endMd.split('-').map(Number);
  const start = new Date(year, sm - 1, sd);
  let end = new Date(year, em - 1, ed);
  if (end < start) {
    if (now >= start) end = new Date(year + 1, em - 1, ed);
    else start.setFullYear(year - 1);
  }
  return now >= start && now <= end;
}

export function getProminentSeasonalTemplates(now = new Date()) {
  return SEASONAL_TEMPLATES.filter((t) => isInProminenceWindow(now, t.prominenceStart, t.prominenceEnd));
}

export function getStudioTemplateOptions(customSeasonal: SeasonalTemplate[] = []) {
  const prominent = getProminentSeasonalTemplates();
  const seasonalIds = new Set([...prominent, ...customSeasonal].map((t) => t.id));
  const base = STUDIO_TEMPLATES.filter((t) => !seasonalIds.has(t.id));

  if (prominent.length > 0) {
    return [...prominent, ...customSeasonal, ...base];
  }
  return [...customSeasonal, ...base];
}

export function findSeasonalTemplate(id: string) {
  return SEASONAL_TEMPLATES.find((t) => t.id === id);
}

export function seasonalHashtagsForTemplate(id: string) {
  return findSeasonalTemplate(id)?.hashtags || [];
}
