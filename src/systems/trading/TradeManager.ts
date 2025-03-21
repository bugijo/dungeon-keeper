import { Trade, TradeStatus } from './Trade';
import { Character } from '../character/Character';
import { EventEmitter } from 'events';

export class TradeManager {
  private trades: Map<string, Trade>;
  private activeTrades: Map<Character, Trade>;
  private eventEmitter: EventEmitter;

  constructor() {
    this.trades = new Map();
    this.activeTrades = new Map();
    this.eventEmitter = new EventEmitter();
  }

  public initiateTrade(initiator: Character, target: Character): Trade | null {
    if (this.isCharacterTrading(initiator) || this.isCharacterTrading(target)) {
      return null;
    }

    const tradeId = this.generateTradeId();
    const trade = new Trade(tradeId, initiator, target);

    this.trades.set(tradeId, trade);
    this.activeTrades.set(initiator, trade);
    this.activeTrades.set(target, trade);

    this.setupTradeListeners(trade);
    this.eventEmitter.emit('tradeInitiated', { trade });

    return trade;
  }

  private setupTradeListeners(trade: Trade): void {
    trade.onTradeCompleted(() => {
      this.removeTrade(trade);
      this.eventEmitter.emit('tradeCompleted', { trade });
    });

    trade.onTradeRejected(({ character }) => {
      this.removeTrade(trade);
      this.eventEmitter.emit('tradeRejected', { trade, character });
    });

    trade.onTradeCancelled(({ character }) => {
      this.removeTrade(trade);
      this.eventEmitter.emit('tradeCancelled', { trade, character });
    });
  }

  private removeTrade(trade: Trade): void {
    this.trades.delete(trade.getId());
    this.activeTrades.delete(trade.getInitiator());
    this.activeTrades.delete(trade.getTarget());
  }

  public getTrade(tradeId: string): Trade | undefined {
    return this.trades.get(tradeId);
  }

  public getActiveTrade(character: Character): Trade | undefined {
    return this.activeTrades.get(character);
  }

  public isCharacterTrading(character: Character): boolean {
    return this.activeTrades.has(character);
  }

  private generateTradeId(): string {
    return `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public onTradeInitiated(callback: (data: { trade: Trade }) => void): void {
    this.eventEmitter.on('tradeInitiated', callback);
  }

  public onTradeCompleted(callback: (data: { trade: Trade }) => void): void {
    this.eventEmitter.on('tradeCompleted', callback);
  }

  public onTradeRejected(callback: (data: { trade: Trade, character: Character }) => void): void {
    this.eventEmitter.on('tradeRejected', callback);
  }

  public onTradeCancelled(callback: (data: { trade: Trade, character: Character }) => void): void {
    this.eventEmitter.on('tradeCancelled', callback);
  }
}