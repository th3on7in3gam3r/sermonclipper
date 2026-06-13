'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

export default function HelpFeedback({ slug }: { slug: string }) {
  const [submitted, setSubmitted] = useState<boolean | null>(null);

  const send = async (helpful: boolean) => {
    if (submitted !== null) return;
    try {
      const res = await fetch('/api/help/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, helpful }),
      });
      if (res.ok) {
        setSubmitted(helpful);
        toast.success('Thanks for your feedback!');
      }
    } catch {
      toast.error('Could not save feedback');
    }
  };

  return (
    <div className="help-feedback">
      <p>Was this helpful?</p>
      <div className="help-feedback-actions">
        <button
          type="button"
          className={`vesper-btn-outline${submitted === true ? ' help-feedback--active' : ''}`}
          onClick={() => send(true)}
          disabled={submitted !== null}
        >
          Yes
        </button>
        <button
          type="button"
          className={`vesper-btn-outline${submitted === false ? ' help-feedback--active' : ''}`}
          onClick={() => send(false)}
          disabled={submitted !== null}
        >
          No
        </button>
      </div>
    </div>
  );
}
