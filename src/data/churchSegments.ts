export type ChurchSegment = 'small-churches' | 'growing-churches' | 'large-churches' | 'multisite';

export const CHURCH_SEGMENTS: Record<
  ChurchSegment,
  {
    title: string;
    headline: string;
    painPoints: string[];
    plan: string;
    testimonial: { quote: string; author: string };
  }
> = {
  'small-churches': {
    title: 'Small Churches',
    headline: 'Professional sermon reels — even without a media team',
    painPoints: [
      'No dedicated videographer — volunteers handle everything',
      'Limited budget for multiple editing tools',
      'Need consistent social presence with minimal weekly effort',
    ],
    plan: 'Start free — upgrade to Creator when you publish weekly',
    testimonial: {
      quote: 'Our church of 80 now posts professional reels every Sunday.',
      author: 'Pastor Elena, Riverside Chapel',
    },
  },
  'growing-churches': {
    title: 'Growing Churches',
    headline: 'One tool your media volunteer can actually use',
    painPoints: [
      'Media team is one part-time volunteer juggling multiple platforms',
      'Sermon length varies — manual clipping takes hours',
      'Need brand consistency as the church grows',
    ],
    plan: 'Creator plan — 20 clips/month covers weekly publishing',
    testimonial: {
      quote: 'Our volunteer went from 4 hours of editing to 20 minutes.',
      author: 'Media Lead Chris, Cornerstone Church',
    },
  },
  'large-churches': {
    title: 'Large Churches',
    headline: 'Scale your social media ministry without scaling your team',
    painPoints: [
      'Multiple services and campuses generate hours of footage',
      'Communications team needs repeatable workflows',
      'Brand standards must be enforced across all exports',
    ],
    plan: 'Church Pro — unlimited clips, team seats, white-label branding',
    testimonial: {
      quote: 'We clip every service and publish across 4 platforms same-day.',
      author: 'Comms Director Amy, Faith Center',
    },
  },
  multisite: {
    title: 'Multisite Churches',
    headline: 'One Vesper account. Every campus. Consistent brand.',
    painPoints: [
      'Each campus needs localized clips from shared teaching',
      'Central comms team manages brand for all locations',
      'Campus pastors want ready-to-share content without editing',
    ],
    plan: 'Church Pro with team seats for campus media leads',
    testimonial: {
      quote: 'Every campus gets on-brand clips from the same sermon within an hour.',
      author: 'Network Admin Paul, City Church Network',
    },
  },
};

export const CHURCH_SEGMENT_SLUGS = Object.keys(CHURCH_SEGMENTS) as ChurchSegment[];

export function parseSegment(raw: string): ChurchSegment | null {
  if (raw in CHURCH_SEGMENTS) return raw as ChurchSegment;
  return null;
}
