export type ShotstackEnvironment = 'sandbox' | 'production';

export type ShotstackConfig = {
  apiKey: string;
  renderUrl: string;
  environment: ShotstackEnvironment;
};

function cleanEnv(value: string | undefined): string {
  return value?.trim() ?? '';
}

/**
 * Resolve Shotstack credentials and endpoint as a matched pair.
 *
 * On production hosts, prefer SHOTSTACK_PRODUCTION_KEY unless SHOTSTACK_ENV=sandbox.
 * Previously we always preferred the sandbox key, which caused 403s when only the
 * production key was valid on vesper.biblefunland.com.
 */
export function getShotstackConfig(): ShotstackConfig | null {
  const sandboxKey = cleanEnv(process.env.SHOTSTACK_SANDBOX_KEY);
  const productionKey = cleanEnv(process.env.SHOTSTACK_PRODUCTION_KEY);
  const envPref = cleanEnv(process.env.SHOTSTACK_ENV).toLowerCase();

  // Explicit env — never fall back to the wrong key/endpoint pair
  if (envPref === 'production') {
    if (!productionKey) return null;
    return {
      apiKey: productionKey,
      renderUrl: 'https://api.shotstack.io/edit/v1/render',
      environment: 'production',
    };
  }

  if (envPref === 'sandbox') {
    if (!sandboxKey) return null;
    return {
      apiKey: sandboxKey,
      renderUrl: 'https://api.shotstack.io/edit/stage/render',
      environment: 'sandbox',
    };
  }

  if (process.env.NODE_ENV === 'production' && productionKey) {
    return {
      apiKey: productionKey,
      renderUrl: 'https://api.shotstack.io/edit/v1/render',
      environment: 'production',
    };
  }

  if (sandboxKey) {
    return {
      apiKey: sandboxKey,
      renderUrl: 'https://api.shotstack.io/edit/stage/render',
      environment: 'sandbox',
    };
  }

  if (productionKey) {
    return {
      apiKey: productionKey,
      renderUrl: 'https://api.shotstack.io/edit/v1/render',
      environment: 'production',
    };
  }

  return null;
}

export function mapShotstackHttpError(
  status: number,
  message: string,
  environment: ShotstackEnvironment
): { httpStatus: number; error: string } {
  if (status === 401 || status === 403) {
    const normalized = message.toLowerCase().trim();
    const isKeyProblem =
      normalized.includes('invalid or disabled') ||
      normalized.includes('invalid api key') ||
      normalized === 'forbidden' ||
      normalized === 'forbidden:' ||
      normalized.startsWith('forbidden');

    if (isKeyProblem) {
      return {
        httpStatus: 502,
        error:
          environment === 'production'
            ? 'Shotstack rejected your production API key. In the Shotstack dashboard, copy the Production key (not Sandbox) into SHOTSTACK_PRODUCTION_KEY on Vercel, set SHOTSTACK_ENV=production, then redeploy.'
            : 'Shotstack rejected your sandbox API key. Copy the Stage/Sandbox key into SHOTSTACK_SANDBOX_KEY, or set SHOTSTACK_ENV=production with a valid production key.',
      };
    }

    return {
      httpStatus: 502,
      error:
        environment === 'production'
          ? `Shotstack production error: ${message}`
          : `Shotstack sandbox error: ${message}`,
    };
  }

  if (status === 400) {
    return {
      httpStatus: 502,
      error: `Shotstack rejected the render payload: ${message}`,
    };
  }

  return {
    httpStatus: status >= 500 ? 502 : 500,
    error: message || `Shotstack request failed (${status})`,
  };
}

/** Extract human-readable error text from Shotstack JSON responses. */
export function parseShotstackErrorBody(
  raw: string,
  data: { message?: string; error?: string; errors?: { detail?: string; title?: string; status?: string }[] }
): string {
  if (data.errors?.length) {
    return data.errors
      .map((e) => {
        if (e.detail?.trim()) return e.detail.trim();
        if (e.title?.trim()) return e.title.trim();
        return e.status ? `HTTP ${e.status}` : '';
      })
      .filter(Boolean)
      .join(' — ');
  }
  if (data.message) return data.message;
  if (data.error) return data.error;
  if (raw) return raw.slice(0, 500);
  return 'Unknown Shotstack error';
}

/** Ping Shotstack with a minimal payload to verify a key + endpoint pair. */
export async function verifyShotstackKey(
  apiKey: string,
  renderUrl: string
): Promise<{ ok: boolean; status: number; message: string }> {
  const response = await fetch(renderUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      timeline: { tracks: [] },
      output: { format: 'mp4', resolution: 'hd', aspectRatio: '9:16' },
    }),
  });

  const raw = await response.text();
  let data: { message?: string; error?: string; errors?: { detail?: string }[] } = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    return { ok: false, status: response.status, message: raw.slice(0, 200) || `HTTP ${response.status}` };
  }

  if (response.ok && (data as { success?: boolean }).success) {
    return { ok: true, status: response.status, message: 'Key accepted' };
  }

  // 400 validation errors mean auth worked — key is valid
  if (response.status === 400) {
    return {
      ok: true,
      status: response.status,
      message: 'Key accepted (validation error on empty timeline is expected)',
    };
  }

  return {
    ok: false,
    status: response.status,
    message: parseShotstackErrorBody(raw, data),
  };
}

const SAMPLE_VIDEO = 'https://shotstack-assets.s3-ap-southeast-2.amazonaws.com/footage/earth.mp4';

/** Submit a tiny real render to confirm the key can queue jobs (not just auth). */
export async function probeShotstackRender(
  apiKey: string,
  renderUrl: string
): Promise<{ ok: boolean; status: number; message: string; renderId?: string }> {
  const response = await fetch(renderUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      timeline: {
        tracks: [
          {
            clips: [
              {
                asset: { type: 'video', src: SAMPLE_VIDEO, trim: 0 },
                start: 0,
                length: 2,
                fit: 'cover',
              },
            ],
          },
        ],
      },
      output: { format: 'mp4', resolution: 'hd', aspectRatio: '9:16' },
    }),
  });

  const raw = await response.text();
  let data: {
    success?: boolean;
    response?: { id?: string };
    message?: string;
    errors?: { detail?: string }[];
  } = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    return { ok: false, status: response.status, message: raw.slice(0, 200) || `HTTP ${response.status}` };
  }

  if (response.ok && data.success && data.response?.id) {
    return {
      ok: true,
      status: response.status,
      message: 'Render queued successfully',
      renderId: data.response.id,
    };
  }

  return {
    ok: false,
    status: response.status,
    message: parseShotstackErrorBody(raw, data),
  };
}
