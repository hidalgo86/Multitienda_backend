import { ConfigService } from '@nestjs/config';
import { generateKeyPairSync } from 'crypto';
import { readFileSync } from 'fs';

let testKeyPair: { privateKey: string; publicKey: string } | null = null;

function getTestKeyPair() {
  if (!testKeyPair) {
    testKeyPair = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      publicKeyEncoding: { type: 'spki', format: 'pem' },
    });
  }

  return testKeyPair;
}

export function readJwtKey(
  configService: ConfigService,
  keyName: 'PRIVATE' | 'PUBLIC',
): string | Buffer {
  const direct = configService.get<string>(`JWT_${keyName}_KEY`);
  const base64 = configService.get<string>(`JWT_${keyName}_KEY_BASE64`);
  const path = configService.get<string>(`JWT_${keyName}_KEY_PATH`);

  if (direct?.trim()) {
    return direct.replace(/\\n/g, '\n');
  }

  if (base64?.trim()) {
    return Buffer.from(base64, 'base64').toString('utf8');
  }

  if (path?.trim()) {
    try {
      return readFileSync(path, 'utf8');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `No se pudo leer JWT_${keyName}_KEY_PATH="${path}". Genera una clave local o usa JWT_${keyName}_KEY/JWT_${keyName}_KEY_BASE64. Detalle: ${message}`,
      );
    }
  }

  if (configService.get<string>('NODE_ENV') === 'test') {
    const { privateKey, publicKey } = getTestKeyPair();
    return keyName === 'PRIVATE' ? privateKey : publicKey;
  }

  throw new Error(
    `Falta JWT_${keyName}_KEY, JWT_${keyName}_KEY_BASE64 o JWT_${keyName}_KEY_PATH`,
  );
}
