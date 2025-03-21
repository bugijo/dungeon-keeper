export abstract class QuestObjective {
  protected description: string;
  protected required: number;
  protected current: number;
  protected completed: boolean;

  constructor(description: string, required: number) {
    this.description = description;
    this.required = required;
    this.current = 0;
    this.completed = false;
  }

  public abstract update(data: any): void;

  public isCompleted(): boolean {
    return this.completed;
  }

  protected checkCompletion(): void {
    this.completed = this.current >= this.required;
  }

  public getProgress(): number {
    return (this.current / this.required) * 100;
  }

  public getDescription(): string {
    return this.description;
  }
}