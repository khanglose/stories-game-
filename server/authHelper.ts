import crypto from 'crypto';

const SALT = process.env.PIN_SALT || 'storyverse_secure_pin_salt_2026';

export function hashPin(pin: string): string {
  if (!pin) return '';
  return crypto.createHmac('sha256', SALT).update(pin.toString().trim()).digest('hex');
}

export function verifyPin(pin: string, storedHash: string): boolean {
  if (!pin || !storedHash) return false;
  const calculated = hashPin(pin);
  try {
    return crypto.timingSafeEqual(Buffer.from(calculated, 'hex'), Buffer.from(storedHash, 'hex'));
  } catch {
    return calculated === storedHash;
  }
}

export function normalizePlayerName(name: string): string {
  return (name || '').trim().toLowerCase();
}
