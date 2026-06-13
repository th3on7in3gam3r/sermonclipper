'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import SiteFooter from '@/components/layout/SiteFooter';

const CATEGORIES = ['Studio', 'Exporting', 'Integrations', 'Billing', 'Other'];
const STATUSES = ['Under Review', 'Planned', 'In Progress', 'Shipped', "Won't Build"];

type FeatureRequest = {
  _id: string;
  title: string;
  description?: string;
  category: string;
  votes: number;
  status: string;
};

export default function FeedbackPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const load = () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (categoryFilter) params.set('category', categoryFilter);
    fetch(`/api/feedback?${params}`)
      .then((r) => r.json())
      .then((d) => setRequests(d.requests || []))
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, [statusFilter, categoryFilter]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, category }),
    });
    if (res.ok) {
      toast.success('Feature request submitted');
      setTitle('');
      setDescription('');
      load();
    } else {
      toast.error('Could not submit request');
    }
  };

  const upvote = async (id: string) => {
    const res = await fetch(`/api/feedback/${id}/vote`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setRequests((prev) =>
        prev.map((r) => (r._id === id ? { ...r, votes: data.votes ?? r.votes + 1 } : r))
      );
      toast.success('Vote recorded');
    } else if (res.status === 401) {
      toast.error('Sign in to upvote');
    }
  };

  return (
    <main className="vesper-mesh-bg-container" style={{ minHeight: '100vh' }}>
      <div className="vesper-mesh-bg" />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '120px 24px 80px', position: 'relative', zIndex: 1 }}>
        <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
          ← Home
        </Link>
        <h1 style={{ fontSize: 36, fontWeight: 900, margin: '16px 0 8px' }}>Feature requests</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>
          Submit ideas and upvote what matters to your ministry. We ship from this board.
        </p>

        <form
          onSubmit={submit}
          className="glass-card premium-border"
          style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}
        >
          <input className="vesper-input" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <textarea className="vesper-input" rows={4} placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
          <select className="vesper-input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button type="submit" className="vesper-btn vesper-btn-primary">
            Submit request
          </button>
        </form>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <select className="vesper-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ flex: 1, minWidth: 140 }}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select className="vesper-input" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ flex: 1, minWidth: 140 }}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {requests.map((r) => (
            <div key={r._id} className="glass-card premium-border" style={{ padding: 20, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <button
                type="button"
                className="vesper-btn-outline"
                style={{ minWidth: 56, flexDirection: 'column', padding: '8px 12px', lineHeight: 1.2 }}
                onClick={() => upvote(r._id)}
              >
                <span style={{ fontSize: 18, fontWeight: 900 }}>{r.votes}</span>
                <span style={{ fontSize: 10 }}>votes</span>
              </button>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                  <span className="vesper-badge badge-violet">{r.category}</span>
                  <span className="vesper-badge">{r.status}</span>
                </div>
                <h3 style={{ margin: '0 0 6px', fontSize: 18 }}>{r.title}</h3>
                {r.description && <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14 }}>{r.description}</p>}
              </div>
            </div>
          ))}
          {!requests.length && <p style={{ color: 'var(--text-muted)' }}>No requests yet — be the first!</p>}
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
