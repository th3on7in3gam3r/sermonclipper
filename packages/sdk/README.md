# @vesper/sdk

Official TypeScript/JavaScript client for the [Vesper](https://vesper.biblefunland.com) sermon clipping API.

## Install

```bash
npm install @vesper/sdk
```

## Quickstart

```typescript
import { VesperClient } from '@vesper/sdk';

const vesper = new VesperClient({ apiKey: process.env.VESPER_API_KEY! });

const source = await vesper.sources.create({
  type: 'youtube',
  url: 'https://www.youtube.com/watch?v=...',
});

const ready = await vesper.sources.waitForComplete(source.id);
const clips = await vesper.clips.list({ sourceId: source.id });
const exported = await vesper.clips.export(clips[0].id, { format: '9:16', wait: true });

console.log(exported.downloadUrl);
```

## Webhook verification

```typescript
import { VesperClient } from '@vesper/sdk';

const isValid = vesper.webhooks.verify(rawBody, req.headers['x-vesper-signature'], webhookSecret);
```

## Features

- Full TypeScript types
- Automatic retry with exponential backoff on 429/5xx
- Built-in `waitForComplete` polling helper
- Zero runtime dependencies (native `fetch`)

## Migration

### v1.0.0

Initial release. API base path `/api/v1/*`.

## License

MIT
