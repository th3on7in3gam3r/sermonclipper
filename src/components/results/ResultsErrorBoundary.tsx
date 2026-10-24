'use client';

import React from 'react';

type State = { hasError: boolean; error: string };

export default class ResultsErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, error: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message };
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div
        role="alert"
        style={{
          minHeight: '100vh',
          background: '#0A0A0F',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 40,
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 500 }}>
          <div style={{ fontSize: 48, marginBottom: 24 }} aria-hidden>
            ⚠️
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>Something went wrong</h2>
          <p style={{ color: '#A1A1AA', fontSize: 16, lineHeight: 1.6, marginBottom: 32 }}>
            {this.state.error || 'An unexpected error occurred while loading your media kit.'}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="vesper-btn shimmer-effect"
            style={{ padding: '14px 32px', fontSize: 15 }}
          >
            RELOAD PAGE
          </button>
        </div>
      </div>
    );
  }
}
