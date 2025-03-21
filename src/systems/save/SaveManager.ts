import { Character } from '../character/Character';
import { GameState } from './GameState';
import { SaveSerializer } from './SaveSerializer';
import { SaveValidator } from './SaveValidator';
import { SaveCompressor } from './SaveCompressor';
import { SaveEncryption } from './SaveEncryption';
import { SaveMetadata } from './SaveMetadata';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

export class SaveManager {
  private static instance: SaveManager;
  private savePath: string;
  private currentSave: GameState | null;
  private autoSaveInterval: number;
  private autoSaveTimer: NodeJS.Timeout | null;
  private eventEmitter: EventEmitter;
  private saveSerializer: SaveSerializer;
  private saveValidator: SaveValidator;
  private saveCompressor: SaveCompressor;
  private saveEncryption: SaveEncryption;

  private constructor() {
    this.savePath = path.join(process.cwd(), 'saves');
    this.currentSave = null;
    this.autoSaveInterval = 5 * 60 * 1000; // 5 minutes
    this.autoSaveTimer = null;
    this.eventEmitter = new EventEmitter();
    this.saveSerializer = new SaveSerializer();
    this.saveValidator = new SaveValidator();
    this.saveCompressor = new SaveCompressor();
    this.saveEncryption = new SaveEncryption();

    this.ensureSaveDirectory();
  }

  public static getInstance(): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager();
    }
    return SaveManager.instance;
  }

  private ensureSaveDirectory(): void {
    if (!fs.existsSync(this.savePath)) {
      fs.mkdirSync(this.savePath, { recursive: true });
    }
  }

  public async saveGame(slot: number, metadata: SaveMetadata): Promise<void> {
    try {
      if (!this.currentSave) {
        throw new Error('No game state to save');
      }

      const serializedData = this.saveSerializer.serialize(this.currentSave);
      const validationResult = this.saveValidator.validate(serializedData);

      if (!validationResult.isValid) {
        throw new Error(`Invalid save data: ${validationResult.errors.join(', ')}`);
      }

      const compressedData = await this.saveCompressor.compress(serializedData);
      const encryptedData = await this.saveEncryption.encrypt(compressedData);

      const savePath = this.getSaveFilePath(slot);
      const metadataPath = this.getMetadataFilePath(slot);

      await fs.promises.writeFile(savePath, encryptedData);
      await fs.promises.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

      this.eventEmitter.emit('gameSaved', { slot, metadata });
    } catch (error) {
      this.eventEmitter.emit('saveError', { error });
      throw error;
    }
  }

  public async loadGame(slot: number): Promise<void> {
    try {
      const savePath = this.getSaveFilePath(slot);
      const metadataPath = this.getMetadataFilePath(slot);

      if (!fs.existsSync(savePath) || !fs.existsSync(metadataPath)) {
        throw new Error(`Save file not found in slot ${slot}`);
      }

      const encryptedData = await fs.promises.readFile(savePath);
      const decryptedData = await this.saveEncryption.decrypt(encryptedData);
      const decompressedData = await this.saveCompressor.decompress(decryptedData);

      const validationResult = this.saveValidator.validate(decompressedData);
      if (!validationResult.isValid) {
        throw new Error(`Corrupted save data: ${validationResult.errors.join(', ')}`);
      }

      this.currentSave = this.saveSerializer.deserialize(decompressedData);
      const metadata = JSON.parse(await fs.promises.readFile(metadataPath, 'utf8'));

      this.eventEmitter.emit('gameLoaded', { slot, metadata });
    } catch (error) {
      this.eventEmitter.emit('loadError', { error });
      throw error;
    }
  }

  public startAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }

    this.autoSaveTimer = setInterval(async () => {
      try {
        const metadata: SaveMetadata = {
          timestamp: new Date().toISOString(),
          type: 'auto',
          gameVersion: process.env.GAME_VERSION || '1.0.0',
          characterName: this.currentSave?.getCharacter()?.getName() || 'Unknown',
          location: this.currentSave?.getCurrentLocation() || 'Unknown',
          playTime: this.currentSave?.getPlayTime() || 0
        };

        await this.saveGame(0, metadata); // Slot 0 reserved for auto-save
      } catch (error) {
        this.eventEmitter.emit('autoSaveError', { error });
      }
    }, this.autoSaveInterval);
  }

  public stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  public setAutoSaveInterval(minutes: number): void {
    this.autoSaveInterval = minutes * 60 * 1000;
    if (this.autoSaveTimer) {
      this.startAutoSave(); // Restart with new interval
    }
  }

  public async getSaveMetadata(slot: number): Promise<SaveMetadata | null> {
    const metadataPath = this.getMetadataFilePath(slot);
    if (!fs.existsSync(metadataPath)) {
      return null;
    }

    try {
      const metadata = JSON.parse(await fs.promises.readFile(metadataPath, 'utf8'));
      return metadata;
    } catch (error) {
      this.eventEmitter.emit('metadataError', { error, slot });
      return null;
    }
  }

  public async listSaves(): Promise<Array<{ slot: number; metadata: SaveMetadata }>> {
    const saves: Array<{ slot: number; metadata: SaveMetadata }> = [];

    for (let slot = 0; slot < 10; slot++) {
      const metadata = await this.getSaveMetadata(slot);
      if (metadata) {
        saves.push({ slot, metadata });
      }
    }

    return saves;
  }

  public async deleteSave(slot: number): Promise<void> {
    try {
      const savePath = this.getSaveFilePath(slot);
      const metadataPath = this.getMetadataFilePath(slot);

      if (fs.existsSync(savePath)) {
        await fs.promises.unlink(savePath);
      }
      if (fs.existsSync(metadataPath)) {
        await fs.promises.unlink(metadataPath);
      }

      this.eventEmitter.emit('saveDeleted', { slot });
    } catch (error) {
      this.eventEmitter.emit('deleteError', { error, slot });
      throw error;
    }
  }

  private getSaveFilePath(slot: number): string {
    return path.join(this.savePath, `save_${slot}.dat`);
  }

  private getMetadataFilePath(slot: number): string {
    return path.join(this.savePath, `save_${slot}.meta.json`);
  }

  public onGameSaved(callback: (data: { slot: number; metadata: SaveMetadata }) => void): void {
    this.eventEmitter.on('gameSaved', callback);
  }

  public onGameLoaded(callback: (data: { slot: number; metadata: SaveMetadata }) => void): void {
    this.eventEmitter.on('gameLoaded', callback);
  }

  public onSaveError(callback: (data: { error: Error }) => void): void {
    this.eventEmitter.on('saveError', callback);
  }

  public onLoadError(callback: (data: { error: Error }) => void): void {
    this.eventEmitter.on('loadError', callback);
  }

  public onAutoSaveError(callback: (data: { error: Error }) => void): void {
    this.eventEmitter.on('autoSaveError', callback);
  }

  public onSaveDeleted(callback: (data: { slot: number }) => void): void {
    this.eventEmitter.on('saveDeleted', callback);
  }
}