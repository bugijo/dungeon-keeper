import { Item } from '../inventory/Item';
import { Character } from '../character/Character';
import { EventEmitter } from 'events';

export enum TradeStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

export class Trade {
  private id: string;
  private initiator: Character;
  private target: Character;
  private initiatorItems: Map<Item, number>;
  private targetItems: Map<Item, number>;
  private initiatorGold: number;
  private targetGold: number;
  private status: TradeStatus;
  private initiatorAccepted: boolean;
  private targetAccepted: boolean;
  private eventEmitter: EventEmitter;

  constructor(id: string, initiator: Character, target: Character) {
    this.id = id;
    this.initiator = initiator;
    this.target = target;
    this.initiatorItems = new Map();
    this.targetItems = new Map();
    this.initiatorGold = 0;
    this.targetGold = 0;
    this.status = TradeStatus.PENDING;
    this.initiatorAccepted = false;
    this.targetAccepted = false;
    this.eventEmitter = new EventEmitter();
  }

  public addInitiatorItem(item: Item, quantity: number): boolean {
    if (this.status !== TradeStatus.PENDING) return false;
    if (!this.initiator.getInventory().hasItem(item, quantity)) return false;

    this.initiatorItems.set(item, (this.initiatorItems.get(item) || 0) + quantity);
    this.resetAcceptance();
    this.eventEmitter.emit('itemAdded', { character: this.initiator, item, quantity });
    return true;
  }

  public addTargetItem(item: Item, quantity: number): boolean {
    if (this.status !== TradeStatus.PENDING) return false;
    if (!this.target.getInventory().hasItem(item, quantity)) return false;

    this.targetItems.set(item, (this.targetItems.get(item) || 0) + quantity);
    this.resetAcceptance();
    this.eventEmitter.emit('itemAdded', { character: this.target, item, quantity });
    return true;
  }

  public setInitiatorGold(amount: number): boolean {
    if (this.status !== TradeStatus.PENDING) return false;
    if (this.initiator.getGold() < amount) return false;

    this.initiatorGold = amount;
    this.resetAcceptance();
    this.eventEmitter.emit('goldUpdated', { character: this.initiator, amount });
    return true;
  }

  public setTargetGold(amount: number): boolean {
    if (this.status !== TradeStatus.PENDING) return false;
    if (this.target.getGold() < amount) return false;

    this.targetGold = amount;
    this.resetAcceptance();
    this.eventEmitter.emit('goldUpdated', { character: this.target, amount });
    return true;
  }

  public accept(character: Character): boolean {
    if (this.status !== TradeStatus.PENDING) return false;

    if (character === this.initiator) {
      this.initiatorAccepted = true;
    } else if (character === this.target) {
      this.targetAccepted = true;
    } else {
      return false;
    }

    this.eventEmitter.emit('tradeAccepted', { character });

    if (this.initiatorAccepted && this.targetAccepted) {
      this.complete();
    }

    return true;
  }

  public reject(character: Character): void {
    this.status = TradeStatus.REJECTED;
    this.eventEmitter.emit('tradeRejected', { character });
  }

  public cancel(character: Character): void {
    this.status = TradeStatus.CANCELLED;
    this.eventEmitter.emit('tradeCancelled', { character });
  }

  private complete(): void {
    if (this.canComplete()) {
      this.exchangeItems();
      this.exchangeGold();
      this.status = TradeStatus.COMPLETED;
      this.eventEmitter.emit('tradeCompleted');
    }
  }

  private canComplete(): boolean {
    return this.initiatorAccepted && 
           this.targetAccepted && 
           this.validateInventorySpace() && 
           this.validateGold();
  }

  private validateInventorySpace(): boolean {
    return this.initiator.getInventory().hasSpaceFor(Array.from(this.targetItems.entries())) &&
           this.target.getInventory().hasSpaceFor(Array.from(this.initiatorItems.entries()));
  }

  private validateGold(): boolean {
    return this.initiator.getGold() >= this.initiatorGold &&
           this.target.getGold() >= this.targetGold;
  }

  private exchangeItems(): void {
    this.initiatorItems.forEach((quantity, item) => {
      this.initiator.getInventory().removeItem(item, quantity);
      this.target.getInventory().addItem(item, quantity);
    });

    this.targetItems.forEach((quantity, item) => {
      this.target.getInventory().removeItem(item, quantity);
      this.initiator.getInventory().addItem(item, quantity);
    });
  }

  private exchangeGold(): void {
    this.initiator.removeGold(this.initiatorGold);
    this.target.removeGold(this.targetGold);
    this.initiator.addGold(this.targetGold);
    this.target.addGold(this.initiatorGold);
  }

  private resetAcceptance(): void {
    this.initiatorAccepted = false;
    this.targetAccepted = false;
  }

  public getStatus(): TradeStatus {
    return this.status;
  }

  public getId(): string {
    return this.id;
  }

  public getInitiator(): Character {
    return this.initiator;
  }

  public getTarget(): Character {
    return this.target;
  }

  public onItemAdded(callback: (data: { character: Character, item: Item, quantity: number }) => void): void {
    this.eventEmitter.on('itemAdded', callback);
  }

  public onGoldUpdated(callback: (data: { character: Character, amount: number }) => void): void {
    this.eventEmitter.on('goldUpdated', callback);
  }

  public onTradeAccepted(callback: (data: { character: Character }) => void): void {
    this.eventEmitter.on('tradeAccepted', callback);
  }

  public onTradeRejected(callback: (data: { character: Character }) => void): void {
    this.eventEmitter.on('tradeRejected', callback);
  }

  public onTradeCancelled(callback: (data: { character: Character }) => void): void {
    this.eventEmitter.on('tradeCancelled', callback);
  }

  public onTradeCompleted(callback: () => void): void {
    this.eventEmitter.on('tradeCompleted', callback);
  }
}