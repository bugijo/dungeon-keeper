import * as crypto from 'crypto';

export class SaveEncryption {
  private algorithm: string;
  private key: Buffer;
  private iv: Buffer;

  constructor() {
    // Use environment variables or secure configuration for these values in production
    const secretKey = process.env.SAVE_ENCRYPTION_KEY || 'your-secret-key-32-chars-long!!!!';
    this.algorithm = 'aes-256-cbc';
    this.key = crypto.scryptSync(secretKey, 'salt', 32);
    this.iv = crypto.randomBytes(16);
  }

  public async encrypt(data: Buffer): Promise<Buffer> {
    try {
      const cipher = crypto.createCipheriv(this.algorithm, this.key, this.iv);
      const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
      
      // Prepend IV to encrypted data for decryption
      return Buffer.concat([this.iv, encrypted]);
    } catch (error) {
      throw new Error(`Failed to encrypt save data: ${error.message}`);
    }
  }

  public async decrypt(data: Buffer): Promise<Buffer> {
    try {
      // Extract IV from the beginning of the data
      const iv = data.slice(0, 16);
      const encryptedData = data.slice(16);

      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
    } catch (error) {
      throw new Error(`Failed to decrypt save data: ${error.message}`);
    }
  }
}