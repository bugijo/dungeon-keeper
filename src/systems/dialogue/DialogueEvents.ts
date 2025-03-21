export enum DialogueEventType {
  NODE_ENTERED = 'NODE_ENTERED',
  NODE_EXITED = 'NODE_EXITED',
  OPTION_SELECTED = 'OPTION_SELECTED',
  DIALOGUE_STARTED = 'DIALOGUE_STARTED',
  DIALOGUE_ENDED = 'DIALOGUE_ENDED'
}

export interface DialogueEvent {
  type: DialogueEventType;
  dialogueId?: string;
  nodeId?: string;
  optionIndex?: number;
  timestamp: number;
}

export class DialogueEventEmitter {
  private listeners: Map<DialogueEventType, ((event: DialogueEvent) => void)[]>;

  constructor() {
    this.listeners = new Map();
  }

  public addEventListener(type: DialogueEventType, callback: (event: DialogueEvent) => void): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)?.push(callback);
  }

  public removeEventListener(type: DialogueEventType, callback: (event: DialogueEvent) => void): void {
    const callbacks = this.listeners.get(type);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  public emit(event: DialogueEvent): void {
    const callbacks = this.listeners.get(event.type);
    if (callbacks) {
      callbacks.forEach(callback => callback(event));
    }
  }
}