import { SignJWT, importPKCS8 } from 'jose';

// Apple Music developer token, shared by /api/musickit-token (handed to MusicKit JS
// in the browser) and the server routes that call the Apple Music API directly.
// Signed ES256 with the MusicKit private key (.p8) from the owner's Apple Developer
// account; Apple accepts at most 6 months between iat and exp.
//
// Env: APPLE_MUSIC_TEAM_ID, APPLE_MUSIC_KEY_ID, APPLE_MUSIC_PRIVATE_KEY. The key may
// be pasted with real line breaks or with literal \n (as Vercel's env UI keeps it).

const ALG = 'ES256';

export function isAppleMusicConfigured(): boolean {
  return Boolean(
    process.env.APPLE_MUSIC_TEAM_ID &&
      process.env.APPLE_MUSIC_KEY_ID &&
      process.env.APPLE_MUSIC_PRIVATE_KEY
  );
}

/**
 * Sign a developer token valid for `expiresInSeconds`. Returns null when the
 * Apple Music keys are not configured; throws when the key cannot be read.
 */
export async function createAppleMusicDeveloperToken(
  expiresInSeconds: number
): Promise<{ token: string; expiresAt: number } | null> {
  const teamId = process.env.APPLE_MUSIC_TEAM_ID;
  const keyId = process.env.APPLE_MUSIC_KEY_ID;
  const privateKeyPem = process.env.APPLE_MUSIC_PRIVATE_KEY;
  if (!teamId || !keyId || !privateKeyPem) return null;

  const privateKey = await importPKCS8(privateKeyPem.replace(/\\n/g, '\n'), ALG);
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + expiresInSeconds;

  const token = await new SignJWT({})
    .setProtectedHeader({ alg: ALG, kid: keyId, typ: 'JWT' })
    .setIssuedAt(now)
    .setIssuer(teamId)
    .setExpirationTime(expiresAt)
    .sign(privateKey);

  return { token, expiresAt };
}
