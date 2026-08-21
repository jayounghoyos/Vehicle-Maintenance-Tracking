import { hash, verify } from '@node-rs/argon2';

/* argon2id is the OWASP first choice for password storage. The library
 * ships prebuilt binaries, so the API image does not need a compiler.
 * Defaults are the recommended parameters; they are not tuned down. */

export function hashPassword(plain: string): Promise<string> {
  return hash(plain);
}

export async function verifyPassword(
  storedHash: string,
  plain: string,
): Promise<boolean> {
  try {
    return await verify(storedHash, plain);
  } catch {
    // a hash this function did not write, e.g. the seed marker
    return false;
  }
}
