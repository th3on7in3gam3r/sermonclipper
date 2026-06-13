'use client';

import { useEffect, useState } from 'react';

export default function NpsSurvey({ clipCount, accountAgeDays }: { clipCount: number; accountAgeDays: number }) {
  const [visible, setVisible] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem('vesper_nps_done')) return;
    if (accountAgeDays >= 14 && clipCount >= 3) setVisible(true);
  }, [accountAgeDays, clipCount]);

  if (!visible || done) return null;

  const submit = async () => {
    if (score === null) return;
    await fetch('/api/nps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score, feedback }),
    });
    localStorage.setItem('vesper_nps_done', '1');
    setDone(true);
    setVisible(false);
  };

  return (
    <div className="nps-survey" role="dialog" aria-label="Feedback survey">
      {score === null ? (
        <>
          <p>How likely are you to recommend Vesper to another church?</p>
          <div className="nps-scale">
            {Array.from({ length: 11 }, (_, i) => (
              <button key={i} type="button" className="nps-score-btn" onClick={() => setScore(i)}>
                {i}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <p>What&apos;s the main reason for your score? (optional)</p>
          <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={2} className="nps-feedback" />
          <button type="button" className="vesper-btn vesper-btn-primary" onClick={submit}>
            Submit
          </button>
        </>
      )}
    </div>
  );
}
