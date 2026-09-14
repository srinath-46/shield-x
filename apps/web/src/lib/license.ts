import { createSign, createVerify, generateKeyPairSync, randomBytes } from 'crypto';

export type LicenseClaims = {
  key: string;
  organizationId: string;
  subscriptionId: string;
  planId: string;
  issuedAt: string;
  expiresAt: string;
};

export function createLicense(input: Omit<LicenseClaims, 'key'>) {
  const key = `SHX-${randomBytes(2).toString('hex').toUpperCase()}-${randomBytes(2).toString('hex').toUpperCase()}-${randomBytes(2).toString('hex').toUpperCase()}`;
  const configured = process.env.LICENSE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if(process.env.NODE_ENV==='production'&&!configured)throw new Error('LICENSE_PRIVATE_KEY must be configured securely in production');
  if(process.env.NODE_ENV==='production'&&!process.env.LICENSE_PUBLIC_KEY)throw new Error('LICENSE_PUBLIC_KEY must be configured in production');
  const generated = configured ? null : generateKeyPairSync('rsa', { modulusLength: 2048, publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } });
  const privateKey = configured ?? generated!.privateKey;
  const publicKey = process.env.LICENSE_PUBLIC_KEY?.replace(/\\n/g, '\n') ?? generated!.publicKey;
  // The exact serialized claims are persisted with the signature, allowing
  // another trusted application to verify the license using only the public key.
  const payload = JSON.stringify({ key, ...input });
  const signature = createSign('RSA-SHA256').update(payload).end().sign(privateKey, 'base64');
  return { key, payload, signature, publicKey };
}

export function verifyLicenseSignature({ payload, signature, publicKey }: Pick<ReturnType<typeof createLicense>, 'payload' | 'signature' | 'publicKey'>) {
  return createVerify('RSA-SHA256').update(payload).end().verify(publicKey, signature, 'base64');
}
