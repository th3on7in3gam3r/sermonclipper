import { SITE_URL, SITE_TITLE, SITE_DESCRIPTION, OG_IMAGE_URL } from '@/lib/siteConfig';

const FAQ_ITEMS = [
  { q: 'How does Vesper work?', a: 'Paste a YouTube sermon link or upload an MP4 file. Our AI analyzes the full sermon and identifies the most powerful, shareable moments.' },
  { q: 'What are the plan limits?', a: 'Free: 2 clips/month. Creator ($19/mo): 20 clips/month. Church Pro ($49/mo): Unlimited clips with white-label branding.' },
  { q: 'Can I use this for my church team?', a: 'Yes! The Church Pro plan supports multi-user access with a shared sermon archive and rendering queue.' },
];

export function LandingStructuredData() {
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Vesper Studio',
    url: SITE_URL,
    logo: `${SITE_URL}/icon-512.png`,
    sameAs: ['https://www.youtube.com/@VesperStudio', 'https://instagram.com/vesperstudio'],
  };

  const software = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_TITLE,
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web',
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    image: OG_IMAGE_URL,
    offers: [
      { '@type': 'Offer', price: '0', priceCurrency: 'USD', name: 'Free' },
      { '@type': 'Offer', price: '19', priceCurrency: 'USD', name: 'Creator' },
      { '@type': 'Offer', price: '49', priceCurrency: 'USD', name: 'Church Pro' },
    ],
  };

  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(software) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
    </>
  );
}
