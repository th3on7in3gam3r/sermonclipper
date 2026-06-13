import { createHash } from 'crypto';

type ScanResult = { clean: boolean; message?: string };

/** Optional VirusTotal hash lookup when VIRUSTOTAL_API_KEY is configured. */
export async function scanUploadHash(buffer: Uint8Array): Promise<ScanResult> {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  if (!apiKey) return { clean: true };

  const hash = createHash('sha256').update(buffer).digest('hex');

  try {
    const res = await fetch(`https://www.virustotal.com/api/v3/files/${hash}`, {
      headers: { 'x-apikey': apiKey },
    });

    if (res.status === 404) {
      // Unknown hash — allow (full upload scan would be too heavy for 500MB files)
      return { clean: true };
    }

    if (!res.ok) {
      console.warn('[VirusScan] VirusTotal API error:', res.status);
      return { clean: true };
    }

    const data = (await res.json()) as {
      data?: { attributes?: { last_analysis_stats?: { malicious?: number } } };
    };
    const malicious = data.data?.attributes?.last_analysis_stats?.malicious ?? 0;
    if (malicious > 0) {
      return { clean: false, message: 'This file was flagged by malware scanners.' };
    }

    return { clean: true };
  } catch (err) {
    console.warn('[VirusScan] Scan skipped:', err);
    return { clean: true };
  }
}
