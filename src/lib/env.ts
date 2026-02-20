/**
 * Environment variable validation for client-side.
 * Validates that required VITE_ env vars are set at build time.
 */

const REQUIRED_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
] as const;

const OPTIONAL_VARS = [
  'VITE_STRIPE_PUBLISHABLE_KEY',
  'VITE_FACEBOOK_APP_ID',
  'VITE_TIKTOK_CLIENT_KEY',
  'VITE_GEMINI_API_KEY',
] as const;

interface EnvValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

export function validateEnv(): EnvValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const key of REQUIRED_VARS) {
    const value = import.meta.env[key];
    if (!value || value === `your-${key.toLowerCase().replace('vite_', '')}-here`) {
      missing.push(key);
    }
  }

  for (const key of OPTIONAL_VARS) {
    const value = import.meta.env[key];
    if (!value) {
      warnings.push(`Optional env var ${key} is not set. Some features may be unavailable.`);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Log env validation results. Call this once on app startup (dev only).
 */
export function logEnvStatus(): void {
  if (import.meta.env.PROD) return; // Don't log in production

  const { valid, missing, warnings } = validateEnv();

  if (!valid) {
    console.error(
      `[EngageHub] Missing required environment variables:\n` +
      missing.map(k => `  - ${k}`).join('\n') +
      `\nAdd them to your .env.local file.`
    );
  }

  for (const w of warnings) {
    console.warn(`[EngageHub] ${w}`);
  }

  if (valid && warnings.length === 0) {
    console.info('[EngageHub] All environment variables configured.');
  }
}
