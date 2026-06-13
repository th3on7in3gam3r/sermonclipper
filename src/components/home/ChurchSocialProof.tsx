// TODO: Replace placeholder initials with real church logo images once we have permission.

const PLACEHOLDER_CHURCHES = [
  { name: 'First Baptist', location: 'Nashville', initials: 'FBC', accent: '#8B5CF6' },
  { name: 'Grace Community', location: 'Austin', initials: 'GCC', accent: '#10B981' },
  { name: 'Hope Fellowship', location: 'Atlanta', initials: 'HF', accent: '#F4B942' },
  { name: 'Cornerstone', location: 'Dallas', initials: 'CC', accent: '#6366F1' },
  { name: 'New Life', location: 'Charlotte', initials: 'NL', accent: '#EC4899' },
] as const;

export default function ChurchSocialProof() {
  return (
    <div className="church-proof">
      <p className="church-proof-label">Trusted by churches like</p>
      <ul className="church-proof-row" aria-label="Churches using Vesper">
        {PLACEHOLDER_CHURCHES.map((church) => (
          <li key={church.initials} className="church-proof-badge">
            <div
              className="church-proof-logo"
              style={{ background: `${church.accent}22`, borderColor: `${church.accent}55` }}
              aria-hidden="true"
            >
              <span style={{ color: church.accent }}>{church.initials}</span>
            </div>
            <div className="church-proof-meta">
              <span className="church-proof-name">{church.name}</span>
              <span className="church-proof-location">{church.location}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
