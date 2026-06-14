export const API_VERSION = 'v1';

export const DEVELOPER_NAV = [
  { href: '/developers', label: 'Overview' },
  { href: '/developers/getting-started', label: 'Getting Started' },
  { href: '/developers/reference', label: 'API Reference' },
  { href: '/developers/changelog', label: 'Changelog' },
] as const;

export const API_ENDPOINTS = [
  {
    id: 'create-source',
    method: 'POST',
    path: '/api/v1/sources',
    summary: 'Upload a video or submit a YouTube URL for processing',
    request: `{
  "type": "youtube",
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "manuscript": "Optional sermon outline text"
}`,
    response: `{
  "ok": true,
  "source": {
    "id": "abc123",
    "status": "queued",
    "type": "youtube",
    "moderation": "pass"
  }
}`,
  },
  {
    id: 'get-source',
    method: 'GET',
    path: '/api/v1/sources/:id',
    summary: 'Check processing status for a source',
    request: null,
    response: `{
  "ok": true,
  "source": {
    "id": "abc123",
    "status": "complete",
    "progress": 100,
    "clipCount": 8
  }
}`,
  },
  {
    id: 'list-clips',
    method: 'GET',
    path: '/api/v1/clips',
    summary: 'List all clips for your account',
    request: null,
    response: `{
  "ok": true,
  "clips": [{ "id": "abc123:0", "title": "...", "impactScore": 92 }],
  "count": 8
}`,
  },
  {
    id: 'get-clip',
    method: 'GET',
    path: '/api/v1/clips/:id',
    summary: 'Get clip metadata and download URL',
    request: null,
    response: `{
  "ok": true,
  "clip": {
    "id": "abc123:0",
    "downloadUrl": "https://..."
  }
}`,
  },
  {
    id: 'export-clip',
    method: 'POST',
    path: '/api/v1/clips/:id/export',
    summary: 'Trigger a render and receive a download URL',
    request: `{ "format": "9:16", "wait": true }`,
    response: `{
  "ok": true,
  "export": {
    "status": "complete",
    "downloadUrl": "https://..."
  }
}`,
  },
  {
    id: 'account',
    method: 'GET',
    path: '/api/v1/account',
    summary: 'Account plan and quota remaining',
    request: null,
    response: `{
  "ok": true,
  "account": {
    "plan": "creator",
    "quota": { "used": 4, "limit": 20 }
  }
}`,
  },
] as const;

export const CODE_SAMPLES = {
  javascript: `import { VesperClient } from '@vesper/sdk';

const vesper = new VesperClient({ apiKey: process.env.VESPER_API_KEY });

const source = await vesper.sources.create({
  type: 'youtube',
  url: 'https://www.youtube.com/watch?v=...',
});

const ready = await vesper.sources.waitForComplete(source.id);
const clips = await vesper.clips.list({ sourceId: source.id });
const exported = await vesper.clips.export(clips[0].id, { format: '9:16' });
console.log(exported.downloadUrl);`,
  python: `import requests, time

API_KEY = "vsp_live_..."
BASE = "https://vesper.biblefunland.com"
headers = {"Authorization": f"Bearer {API_KEY}"}

r = requests.post(f"{BASE}/api/v1/sources", json={
    "type": "youtube",
    "url": "https://www.youtube.com/watch?v=...",
}, headers=headers)
source_id = r.json()["source"]["id"]

while True:
    s = requests.get(f"{BASE}/api/v1/sources/{source_id}", headers=headers).json()
    if s["source"]["status"] == "complete":
        break
    time.sleep(5)

clips = requests.get(f"{BASE}/api/v1/clips", params={"sourceId": source_id}, headers=headers).json()`,
  curl: `curl -X POST https://vesper.biblefunland.com/api/v1/sources \\
  -H "Authorization: Bearer vsp_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"type":"youtube","url":"https://www.youtube.com/watch?v=..."}'`,
} as const;

export const API_CHANGELOG = [
  {
    version: 'v1.0.0',
    date: '2026-06-14',
    changes: [
      'Initial public REST API release',
      'API key authentication with vsp_live_ / vsp_test_ prefixes',
      'Sources, clips, export, and account endpoints',
      '@vesper/sdk npm package',
    ],
  },
] as const;
