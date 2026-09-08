import { z } from "zod";

/**
 * Public environment configuration.
 *
 * Only `NEXT_PUBLIC_*` values may appear here — anything in this module can end up in the
 * client bundle. Privileged credentials (service-role keys, signing certificates, store
 * API keys) must stay in server-only code and must never be read from here.
 *
 * Every value is optional by design: Reactively has to boot and be developable with no
 * configuration at all. Supabase is prepared, not required.
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

/**
 * Parsed once at module load.
 *
 * The properties are read statically rather than through a loop so Next can inline them
 * at build time; `process.env[key]` would not be replaced.
 */
const parsed = publicEnvSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

if (!parsed.success) {
  // Malformed configuration is a real problem, but it must not prevent the app from
  // booting: an invalid Supabase URL should degrade to "cloud features unavailable".
  console.warn(
    "[reactively] Ignoring invalid public environment configuration:",
    z.treeifyError(parsed.error),
  );
}

export const publicEnv: PublicEnv = parsed.success ? parsed.data : {};

/** True when the cloud backend is configured. Everything cloud-related must check this. */
export function isSupabaseConfigured(): boolean {
  return Boolean(publicEnv.NEXT_PUBLIC_SUPABASE_URL && publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
