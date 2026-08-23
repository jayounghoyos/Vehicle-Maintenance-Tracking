import { randomInt } from 'node:crypto';

/* No 0/O, no 1/l/I. These get read off a screen and typed by hand, and a
 * password nobody can transcribe is a password that ends up on a sticky
 * note. Lowercase only, for the same reason. */
const ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789';
const LENGTH = 12;

/** A temporary password for an imported account. randomInt, not
 *  Math.random: this one guards an account until its owner changes it. */
export function temporaryPassword(): string {
  let out = '';
  for (let i = 0; i < LENGTH; i += 1) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}
