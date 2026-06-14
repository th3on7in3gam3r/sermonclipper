import { VesperHttpClient } from './http.js';
import { verifyWebhook } from './webhooks.js';
import type {
  AccountInfo,
  Clip,
  CreateSourceInput,
  ExportResult,
  Source,
  VesperClientOptions,
  WaitOptions,
} from './types.js';

export { VesperApiError } from './types.js';
export type * from './types.js';

export class VesperClient {
  private http: VesperHttpClient;

  sources: SourcesResource;
  clips: ClipsResource;
  account: AccountResource;
  webhooks: { verify: typeof verifyWebhook };

  constructor(options: VesperClientOptions) {
    this.http = new VesperHttpClient(options);
    this.sources = new SourcesResource(this.http);
    this.clips = new ClipsResource(this.http);
    this.account = new AccountResource(this.http);
    this.webhooks = { verify: verifyWebhook };
  }
}

class SourcesResource {
  constructor(private http: VesperHttpClient) {}

  async create(input: CreateSourceInput): Promise<Source> {
    const body =
      input.type === 'youtube'
        ? { type: 'youtube', url: input.url, manuscript: input.manuscript }
        : { type: 'upload', storageKey: input.storageKey, manuscript: input.manuscript };
    const res = await this.http.request<{ source: Source }>('POST', '/api/v1/sources', body);
    return res.source;
  }

  async get(id: string): Promise<Source> {
    const res = await this.http.request<{ source: Source }>('GET', `/api/v1/sources/${encodeURIComponent(id)}`);
    return res.source;
  }

  async waitForComplete(id: string, options: WaitOptions = {}): Promise<Source> {
    const intervalMs = options.intervalMs ?? 5000;
    const timeoutMs = options.timeoutMs ?? 30 * 60 * 1000;
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      const source = await this.get(id);
      options.onPoll?.(source);
      if (source.status === 'complete') return source;
      if (source.status === 'failed') throw new Error(source.error || 'Processing failed');
      await new Promise((r) => setTimeout(r, intervalMs));
    }

    throw new Error('Timed out waiting for source to complete');
  }
}

class ClipsResource {
  constructor(private http: VesperHttpClient) {}

  async list(params?: { sourceId?: string }): Promise<Clip[]> {
    const qs = params?.sourceId ? `?sourceId=${encodeURIComponent(params.sourceId)}` : '';
    const res = await this.http.request<{ clips: Clip[] }>('GET', `/api/v1/clips${qs}`);
    return res.clips;
  }

  async get(id: string): Promise<Clip> {
    const res = await this.http.request<{ clip: Clip }>('GET', `/api/v1/clips/${encodeURIComponent(id)}`);
    return res.clip;
  }

  async delete(id: string): Promise<void> {
    await this.http.request('DELETE', `/api/v1/clips/${encodeURIComponent(id)}`);
  }

  async export(id: string, options?: { format?: string; wait?: boolean }): Promise<ExportResult> {
    const res = await this.http.request<{ export: ExportResult }>(
      'POST',
      `/api/v1/clips/${encodeURIComponent(id)}/export`,
      options ?? {}
    );
    return res.export;
  }
}

class AccountResource {
  constructor(private http: VesperHttpClient) {}

  async get(): Promise<AccountInfo> {
    const res = await this.http.request<{ account: AccountInfo }>('GET', '/api/v1/account');
    return res.account;
  }
}

export default VesperClient;
