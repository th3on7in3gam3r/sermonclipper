export type ComparePage = {
  slug: string;
  competitor: string;
  headline: string;
  summary: string[];
  testimonial: { quote: string; author: string; church: string };
  features: { name: string; vesper: boolean; competitor: boolean }[];
};

export const COMPARE_PAGES: ComparePage[] = [
  {
    slug: 'vesper-vs-opus-clip',
    competitor: 'Opus Clip',
    headline: 'Vesper vs Opus Clip — Which is better for churches?',
    summary: [
      'Opus Clip excels at generic short-form repurposing for creators and marketers. Its AI finds viral moments across any vertical content.',
      'Vesper is purpose-built for sermon content — theological context, scripture detection, church brand kits, and ministry-focused social kits.',
      'Choose Opus Clip for general podcast/video clips. Choose Vesper when your source material is preaching and your audience is a congregation.',
    ],
    testimonial: {
      quote: 'We switched from Opus Clip because Vesper actually understands sermon structure.',
      author: 'Pastor James R.',
      church: 'Grace Community Church',
    },
    features: [
      { name: 'Built for sermon content', vesper: true, competitor: false },
      { name: 'Bible verse detection', vesper: true, competitor: false },
      { name: 'Theological context AI', vesper: true, competitor: false },
      { name: 'Church brand kit', vesper: true, competitor: false },
      { name: 'Free plan available', vesper: true, competitor: false },
      { name: 'Generic viral clip AI', vesper: false, competitor: true },
    ],
  },
  {
    slug: 'vesper-vs-descript',
    competitor: 'Descript',
    headline: 'Vesper vs Descript — Which is better for churches?',
    summary: [
      'Descript is a powerful audio/video editor with transcription-first workflows — ideal for podcasters who want manual control.',
      'Vesper automates the entire sermon-to-reel pipeline: AI clip selection, captions, formats, and social distribution kits.',
      'Use Descript for full manual editing. Use Vesper when you want AI to find the best sermon moments in minutes.',
    ],
    testimonial: {
      quote: 'Descript was too much editing for our volunteer team. Vesper gives us ready-to-post clips.',
      author: 'Media Director Sarah K.',
      church: 'New Life Fellowship',
    },
    features: [
      { name: 'Automated clip detection', vesper: true, competitor: false },
      { name: 'Sermon manuscript support', vesper: true, competitor: false },
      { name: 'Manual timeline editing', vesper: false, competitor: true },
      { name: 'Church-focused templates', vesper: true, competitor: false },
      { name: 'Free plan available', vesper: true, competitor: false },
    ],
  },
  {
    slug: 'vesper-vs-captions-app',
    competitor: 'Captions App',
    headline: 'Vesper vs Captions App — Which is better for churches?',
    summary: [
      'Captions App focuses on AI-generated talking-head videos and caption styling for social creators.',
      'Vesper handles full-length sermon videos — finding theologically significant moments and exporting ministry-ready reels.',
      'Captions App suits solo creators. Vesper suits churches publishing weekly sermon highlights.',
    ],
    testimonial: {
      quote: 'Captions App could not handle our 45-minute sermons. Vesper was built for exactly that.',
      author: 'Communications Lead David M.',
      church: 'Crossway Church',
    },
    features: [
      { name: 'Full sermon processing', vesper: true, competitor: false },
      { name: 'Scripture moment detection', vesper: true, competitor: false },
      { name: 'AI avatar videos', vesper: false, competitor: true },
      { name: 'Team & church plans', vesper: true, competitor: false },
    ],
  },
  {
    slug: 'vesper-vs-vidyo-ai',
    competitor: 'Vidyo.ai',
    headline: 'Vesper vs Vidyo.ai — Which is better for churches?',
    summary: [
      'Vidyo.ai repurposes long-form content into short clips with a focus on marketing and podcasters.',
      'Vesper adds ministry-specific intelligence: impact scoring for theological moments, scripture references, and church branding.',
      'Vidyo.ai is strong for content marketers. Vesper is strong for pastors and church media teams.',
    ],
    testimonial: {
      quote: 'Vidyo clips felt random. Vesper clips feel like they were chosen by someone who knows our theology.',
      author: 'Pastor Marcus T.',
      church: 'Hope City Church',
    },
    features: [
      { name: 'Theological impact scoring', vesper: true, competitor: false },
      { name: 'Bible verse captions', vesper: true, competitor: false },
      { name: 'Planning Center integration', vesper: true, competitor: false },
      { name: 'Generic content repurposing', vesper: false, competitor: true },
    ],
  },
];

export function getComparePage(slug: string) {
  return COMPARE_PAGES.find((p) => p.slug === slug);
}
