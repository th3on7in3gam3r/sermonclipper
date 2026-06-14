import { VesperApiError } from './types.js';
const DEFAULT_BASE = 'https://vesper.biblefunland.com';
export class VesperHttpClient {
    apiKey;
    baseUrl;
    maxRetries;
    fetchFn;
    constructor(options) {
        this.apiKey = options.apiKey;
        this.baseUrl = (options.baseUrl || DEFAULT_BASE).replace(/\/$/, '');
        this.maxRetries = options.maxRetries ?? 3;
        this.fetchFn = options.fetch ?? fetch;
    }
    async request(method, path, body) {
        let lastError;
        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            try {
                const res = await this.fetchFn(`${this.baseUrl}${path}`, {
                    method,
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                    body: body !== undefined ? JSON.stringify(body) : undefined,
                });
                const data = (await res.json().catch(() => ({})));
                if (res.status === 429 || res.status >= 500) {
                    if (attempt < this.maxRetries) {
                        await sleep(Math.pow(2, attempt) * 500);
                        continue;
                    }
                }
                if (!res.ok) {
                    throw new VesperApiError(String(data.error || res.statusText), res.status, typeof data.code === 'string' ? data.code : undefined);
                }
                return data;
            }
            catch (err) {
                lastError = err;
                if (err instanceof VesperApiError && err.status !== 429 && err.status < 500)
                    throw err;
                if (attempt >= this.maxRetries)
                    throw err;
                await sleep(Math.pow(2, attempt) * 500);
            }
        }
        throw lastError;
    }
}
function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}
