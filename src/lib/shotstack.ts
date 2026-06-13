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
    return {
      httpStatus: 502,
      error:
        environment === 'production'
          ? 'Shotstack rejected the production API key. Confirm SHOTSTACK_PRODUCTION_KEY is set correctly in your hosting environment.'
          : 'Shotstack rejected the sandbox API key. Confirm SHOTSTACK_SANDBOX_KEY is set correctly, or set SHOTSTACK_ENV=production with a valid production key.',
    };
  }

  return {
    httpStatus: status >= 500 ? 502 : 500,
    error: message || `Shotstack request failed (${status})`,
  };
}
