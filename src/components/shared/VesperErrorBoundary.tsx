'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';

type Props = { children: ReactNode; fallback?: ReactNode };
type State = { hasError: boolean };

export default class VesperErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="error-boundary-fallback" role="alert">
            <h2>Something went wrong</h2>
            <p>We&apos;re on it — our team has been notified. Try refreshing the page.</p>
            <button
              type="button"
              className="vesper-btn vesper-btn-primary"
              onClick={() => window.location.reload()}
            >
              Refresh
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
