import { type VesperClientOptions } from './types.js';
export declare class VesperHttpClient {
    private apiKey;
    private baseUrl;
    private maxRetries;
    private fetchFn;
    constructor(options: VesperClientOptions);
    request<T>(method: string, path: string, body?: unknown): Promise<T>;
}
