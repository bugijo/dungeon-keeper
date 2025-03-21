import * as zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

export class SaveCompressor {
  public async compress(data: string): Promise<Buffer> {
    try {
      return await gzip(Buffer.from(data));
    } catch (error) {
      throw new Error(`Failed to compress save data: ${error.message}`);
    }
  }

  public async decompress(data: Buffer): Promise<string> {
    try {
      const decompressed = await gunzip(data);
      return decompressed.toString();
    } catch (error) {
      throw new Error(`Failed to decompress save data: ${error.message}`);
    }
  }
}