export type VesperClientOptions = {
    apiKey: string;
    baseUrl?: string;
    maxRetries?: number;
    fetch?: typeof fetch;
};
export type SourceType = 'youtube' | 'upload';
export type CreateSourceInput = {
    type: SourceType;
    url?: string;
    storageKey?: string;
    manuscript?: string;
};
export type Source = {
    id: string;
    status: 'queued' | 'processing' | 'complete' | 'failed';
    type?: SourceType;
    progress?: number;
    clipCount?: number;
    error?: string | null;
};
export type Clip = {
    id: string;
    sourceId: string;
    index: number;
    title: string;
    quote: string;
    start?: unknown;
    end?: unknown;
    impactScore?: unknown;
    captions?: string[];
    downloadUrl?: string | null;
    hasScripture?: boolean;
    scriptureReferences?: string[];
};
export type ExportResult = {
    clipId: string;
    status: string;
    format: string;
    downloadUrl?: string | null;
    renderId?: string;
};
export type AccountInfo = {
    plan: string;
    email?: string;
    quota: {
        used: number;
        limit: number;
        resetAt: string;
    };
};
export type WaitOptions = {
    intervalMs?: number;
    timeoutMs?: number;
    onPoll?: (source: Source) => void;
};
export declare class VesperApiError extends Error {
    status: number;
    code?: string | undefined;
    constructor(message: string, status: number, code?: string | undefined);
}
