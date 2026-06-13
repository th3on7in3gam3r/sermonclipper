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

  if (envPref === 'sandbox' && sandboxKey) {
    return {
      apiKey: sandboxKey,
      renderUrl: 'https://api.shotstack.io/edit/stage/render',
      environment: 'sandbox',
    };
  }

  if (envPref === 'production' && productionKey) {
    return {
      apiKey: productionKey,
      renderUrl: 'https://api.shotstack.io/edit/v1/render',
      environment: 'production',
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
    const normalized = message.toLowerCase();
    if (normalized.includes('invalid or disabled') || normalized.includes('invalid api key')) {
      return {
        httpStatus: 502,
        error:
          environment === 'production'
            ? 'Shotstack rejected your production API key (invalid or disabled). In the Shotstack dashboard, copy the Production key into SHOTSTACK_PRODUCTION_KEY on Vercel, then redeploy.'
            : 'Shotstack rejected your sandbox API key (invalid or disabled). Copy the Stage/Sandbox key into SHOTSTACK_SANDBOX_KEY, or set SHOTSTACK_ENV=production with a valid production key.',
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

  return {
    httpStatus: status >= 500 ? 502 : 500,
    error: message || `Shotstack request failed (${status})`,
  };
}

/** Extract human-readable error text from Shotstack JSON responses. */
export function parseShotstackErrorBody(
  raw: string,
  data: { message?: string; error?: string; errors?: { detail?: string; title?: string }[] }
): string {
  const fromErrors = data.errors?.map((e) => e.detail || e.title).filter(Boolean).join(' — ');
  if (fromErrors) return fromErrors;
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
    return { ok: true, status: response.status, message: 'Key accepted (validation error on empty timeline is expected)' };
  }

  return {
    ok: false,
    status: response.status,
    message: parseShotstackErrorBody(raw, data),
  };
}
