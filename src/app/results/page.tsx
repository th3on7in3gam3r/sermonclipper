import { Suspense } from 'react';
import ResultsErrorBoundary from '@/components/results/ResultsErrorBoundary';
import StudioHelpShell from '@/components/help/StudioHelpShell';
import ResultsView from './ResultsView';

export default function Results() {
  return (
    <ResultsErrorBoundary>
      <StudioHelpShell>
        <main style={{ minHeight: '100vh', background: 'var(--background)', color: '#fff' }}>
          <Suspense fallback={null}>
            <ResultsView />
          </Suspense>
        </main>
      </StudioHelpShell>
    </ResultsErrorBoundary>
  );
}
