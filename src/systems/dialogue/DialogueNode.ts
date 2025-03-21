export interface DialogueOption {
  text: string;
  nextNodeId: string;
  condition?: () => boolean;
  action?: () => void;
}

export class DialogueNode {
  private id: string;
  private text: string;
  private options: DialogueOption[];
  private onEnter?: () => void;
  private onExit?: () => void;

  constructor(id: string, text: string, options: DialogueOption[] = []) {
    this.id = id;
    this.text = text;
    this.options = options;
  }

  public getId(): string {
    return this.id;
  }

  public getText(): string {
    return this.text;
  }

  public getOptions(): DialogueOption[] {
    return this.options.filter(option => !option.condition || option.condition());
  }

  public addOption(option: DialogueOption): void {
    this.options.push(option);
  }

  public setOnEnter(callback: () => void): void {
    this.onEnter = callback;
  }

  public setOnExit(callback: () => void): void {
    this.onExit = callback;
  }

  public enter(): void {
    if (this.onEnter) {
      this.onEnter();
    }
  }

  public exit(): void {
    if (this.onExit) {
      this.onExit();
    }
  }
}