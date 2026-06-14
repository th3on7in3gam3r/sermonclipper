import { VesperHttpClient } from './http.js';
import { verifyWebhook } from './webhooks.js';
import type { AccountInfo, Clip, CreateSourceInput, ExportResult, Source, VesperClientOptions, WaitOptions } from './types.js';
export { VesperApiError } from './types.js';
export type * from './types.js';
export declare class VesperClient {
    private http;
    sources: SourcesResource;
    clips: ClipsResource;
    account: AccountResource;
    webhooks: {
        verify: typeof verifyWebhook;
    };
    constructor(options: VesperClientOptions);
}
declare class SourcesResource {
    private http;
    constructor(http: VesperHttpClient);
    create(input: CreateSourceInput): Promise<Source>;
    get(id: string): Promise<Source>;
    waitForComplete(id: string, options?: WaitOptions): Promise<Source>;
}
declare class ClipsResource {
    private http;
    constructor(http: VesperHttpClient);
    list(params?: {
        sourceId?: string;
    }): Promise<Clip[]>;
    get(id: string): Promise<Clip>;
    delete(id: string): Promise<void>;
    export(id: string, options?: {
        format?: string;
        wait?: boolean;
    }): Promise<ExportResult>;
}
declare class AccountResource {
    private http;
    constructor(http: VesperHttpClient);
    get(): Promise<AccountInfo>;
}
export default VesperClient;
