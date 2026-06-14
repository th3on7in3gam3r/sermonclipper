import { VesperHttpClient } from './http.js';
import { verifyWebhook } from './webhooks.js';
export { VesperApiError } from './types.js';
export class VesperClient {
    http;
    sources;
    clips;
    account;
    webhooks;
    constructor(options) {
        this.http = new VesperHttpClient(options);
        this.sources = new SourcesResource(this.http);
        this.clips = new ClipsResource(this.http);
        this.account = new AccountResource(this.http);
        this.webhooks = { verify: verifyWebhook };
    }
}
class SourcesResource {
    http;
    constructor(http) {
        this.http = http;
    }
    async create(input) {
        const body = input.type === 'youtube'
            ? { type: 'youtube', url: input.url, manuscript: input.manuscript }
            : { type: 'upload', storageKey: input.storageKey, manuscript: input.manuscript };
        const res = await this.http.request('POST', '/api/v1/sources', body);
        return res.source;
    }
    async get(id) {
        const res = await this.http.request('GET', `/api/v1/sources/${encodeURIComponent(id)}`);
        return res.source;
    }
    async waitForComplete(id, options = {}) {
        const intervalMs = options.intervalMs ?? 5000;
        const timeoutMs = options.timeoutMs ?? 30 * 60 * 1000;
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            const source = await this.get(id);
            options.onPoll?.(source);
            if (source.status === 'complete')
                return source;
            if (source.status === 'failed')
                throw new Error(source.error || 'Processing failed');
            await new Promise((r) => setTimeout(r, intervalMs));
        }
        throw new Error('Timed out waiting for source to complete');
    }
}
class ClipsResource {
    http;
    constructor(http) {
        this.http = http;
    }
    async list(params) {
        const qs = params?.sourceId ? `?sourceId=${encodeURIComponent(params.sourceId)}` : '';
        const res = await this.http.request('GET', `/api/v1/clips${qs}`);
        return res.clips;
    }
    async get(id) {
        const res = await this.http.request('GET', `/api/v1/clips/${encodeURIComponent(id)}`);
        return res.clip;
    }
    async delete(id) {
        await this.http.request('DELETE', `/api/v1/clips/${encodeURIComponent(id)}`);
    }
    async export(id, options) {
        const res = await this.http.request('POST', `/api/v1/clips/${encodeURIComponent(id)}/export`, options ?? {});
        return res.export;
    }
}
class AccountResource {
    http;
    constructor(http) {
        this.http = http;
    }
    async get() {
        const res = await this.http.request('GET', '/api/v1/account');
        return res.account;
    }
}
export default VesperClient;
