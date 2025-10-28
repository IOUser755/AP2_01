import crypto from 'node:crypto';

import { KeyManagementServiceClient } from '@google-cloud/kms';

import { AppError } from './AppError.js';
import { logger } from './logger.js';

interface EncryptionConfig {
  algorithm: string;
  keyRing: string;
  cryptoKey: string;
  location: string;
  projectId: string;
}

class CryptoManager {
  private kmsClient: KeyManagementServiceClient;

  private config: EncryptionConfig;

  constructor() {
    this.kmsClient = new KeyManagementServiceClient();
    this.config = {
      algorithm: 'aes-256-gcm',
      keyRing: process.env.GCP_KMS_KEY_RING ?? '',
      cryptoKey: process.env.GCP_KMS_CRYPTO_KEY ?? '',
      location: process.env.GCP_KMS_LOCATION ?? '',
      projectId: process.env.GCP_PROJECT_ID ?? '',
    };
  }

  private getCryptoKeyPath(): string {
    const { projectId, location, keyRing, cryptoKey } = this.config;

    if (!projectId || !location || !keyRing || !cryptoKey) {
      throw new AppError('KMS configuration is incomplete', {
        statusCode: 500,
        code: 'KMS_CONFIGURATION_ERROR',
      });
    }

    return this.kmsClient.cryptoKeyPath(projectId, location, keyRing, cryptoKey);
  }

  async encryptWithKMS(plaintext: string): Promise<string> {
    try {
      const name = this.getCryptoKeyPath();

      const [result] = await this.kmsClient.encrypt({
        name,
        plaintext: Buffer.from(plaintext, 'utf8'),
      });

      if (!result.ciphertext) {
        throw new Error('KMS did not return ciphertext');
      }

      return result.ciphertext.toString('base64');
    } catch (error) {
      logger.error('KMS encryption failed', error instanceof Error ? error : new Error(String(error)));
      throw new AppError('Encryption failed', { statusCode: 500, code: 'KMS_ENCRYPTION_FAILED' });
    }
  }

  async decryptWithKMS(ciphertext: string): Promise<string> {
    try {
      const name = this.getCryptoKeyPath();

      const [result] = await this.kmsClient.decrypt({
        name,
        ciphertext: Buffer.from(ciphertext, 'base64'),
      });

      if (!result.plaintext) {
        throw new Error('KMS did not return plaintext');
      }

      return result.plaintext.toString('utf8');
    } catch (error) {
      logger.error('KMS decryption failed', error instanceof Error ? error : new Error(String(error)));
      throw new AppError('Decryption failed', { statusCode: 500, code: 'KMS_DECRYPTION_FAILED' });
    }
  }

  encryptLocal(text: string, password: string): string {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(password, 'salt', 32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]).toString('hex');

    return `${iv.toString('hex')}:${encrypted}`;
  }

  decryptLocal(encryptedText: string, password: string): string {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(password, 'salt', 32);

    const [ivHex, encrypted] = encryptedText.split(':');
    if (!ivHex || !encrypted) {
      throw new AppError('Invalid encrypted payload', { statusCode: 400, code: 'INVALID_ENCRYPTED_TEXT' });
    }

    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encrypted, 'hex')),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }

  async generateMandateSignature(mandateData: unknown): Promise<string> {
    const privateKey = await this.getSigningKey();
    const data = JSON.stringify(mandateData);

    const sign = crypto.createSign('SHA256');
    sign.update(data);
    sign.end();

    return sign.sign(privateKey, 'hex');
  }

  async verifyMandateSignature(mandateData: unknown, signature: string): Promise<boolean> {
    try {
      const publicKey = await this.getVerificationKey();
      const data = JSON.stringify(mandateData);

      const verify = crypto.createVerify('SHA256');
      verify.update(data);
      verify.end();

      return verify.verify(publicKey, signature, 'hex');
    } catch (error) {
      logger.error('Signature verification failed', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  private async getSigningKey(): Promise<string> {
    if (!process.env.MANDATE_SIGNING_PRIVATE_KEY) {
      throw new AppError('Mandate signing key not configured', {
        statusCode: 500,
        code: 'MANDATE_SIGNING_KEY_MISSING',
      });
    }

    return process.env.MANDATE_SIGNING_PRIVATE_KEY;
  }

  private async getVerificationKey(): Promise<string> {
    if (!process.env.MANDATE_VERIFICATION_PUBLIC_KEY) {
      throw new AppError('Mandate verification key not configured', {
        statusCode: 500,
        code: 'MANDATE_VERIFICATION_KEY_MISSING',
      });
    }

    return process.env.MANDATE_VERIFICATION_PUBLIC_KEY;
  }

  generateSecureToken(length = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  async hashPassword(password: string): Promise<string> {
    const bcrypt = await import('bcrypt');
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    const bcrypt = await import('bcrypt');
    return bcrypt.compare(password, hash);
  }
}

export const cryptoManager = new CryptoManager();

export const {
  encryptWithKMS,
  decryptWithKMS,
  encryptLocal,
  decryptLocal,
  generateMandateSignature,
  verifyMandateSignature,
  generateSecureToken,
  hashPassword,
  verifyPassword,
} = cryptoManager;

export default cryptoManager;
