type CircuitState = 'closed' | 'open' | 'half_open';

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures = 0;
  private openedAt = 0;
  private readonly name: string;

  constructor(
    name: string,
    private readonly options: {
      failureThreshold?: number;
      resetMs?: number;
      onStateChange?: (name: string, state: CircuitState) => void;
    } = {}
  ) {
    this.name = name;
  }

  getState(): CircuitState {
    if (this.state === 'open') {
      const resetMs = this.options.resetMs ?? 30_000;
      if (Date.now() - this.openedAt >= resetMs) {
        this.setState('half_open');
      }
    }
    return this.state;
  }

  isOpen(): boolean {
    return this.getState() === 'open';
  }

  recordSuccess() {
    this.failures = 0;
    if (this.state !== 'closed') this.setState('closed');
  }

  recordFailure() {
    this.failures += 1;
    const threshold = this.options.failureThreshold ?? 5;
    if (this.failures >= threshold) {
      this.openedAt = Date.now();
      this.setState('open');
    }
  }

  private setState(next: CircuitState) {
    if (this.state === next) return;
    this.state = next;
    this.options.onStateChange?.(this.name, next);
    console.warn(`[CircuitBreaker] ${this.name} → ${next}`);
  }
}

export const mongoCircuit = new CircuitBreaker('mongodb', {
  onStateChange: (name, state) => {
    void import('@/lib/telemetry/metrics').then(({ recordCircuitState }) => recordCircuitState(name, state));
  },
});

export const postgresCircuit = new CircuitBreaker('postgres', {
  onStateChange: (name, state) => {
    void import('@/lib/telemetry/metrics').then(({ recordCircuitState }) => recordCircuitState(name, state));
  },
});
