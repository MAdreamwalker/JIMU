import { safeStorage } from 'electron';

export interface CryptoStore {
  encrypt(value: string): string;
  decrypt(value: string): string;
}

export function createCryptoStore(): CryptoStore {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Secure storage is unavailable');
  }

  return {
    encrypt(value) {
      return safeStorage.encryptString(value).toString('base64');
    },
    decrypt(value) {
      return safeStorage.decryptString(Buffer.from(value, 'base64'));
    },
  };
}
