import { DialogueNode } from './DialogueNode';

export class DialogueGraph {
  private nodes: Map<string, DialogueNode>;
  private currentNode: DialogueNode | null;

  constructor() {
    this.nodes = new Map();
    this.currentNode = null;
  }

  public addNode(node: DialogueNode): void {
    this.nodes.set(node.getId(), node);
  }

  public getNode(id: string): DialogueNode | undefined {
    return this.nodes.get(id);
  }

  public start(startNodeId: string): boolean {
    const startNode = this.nodes.get(startNodeId);
    if (startNode) {
      this.currentNode = startNode;
      this.currentNode.enter();
      return true;
    }
    return false;
  }

  public getCurrentNode(): DialogueNode | null {
    return this.currentNode;
  }

  public selectOption(optionIndex: number): boolean {
    if (!this.currentNode) return false;

    const options = this.currentNode.getOptions();
    if (optionIndex < 0 || optionIndex >= options.length) return false;

    const selectedOption = options[optionIndex];
    const nextNode = this.nodes.get(selectedOption.nextNodeId);

    if (!nextNode) return false;

    if (selectedOption.action) {
      selectedOption.action();
    }

    this.currentNode.exit();
    this.currentNode = nextNode;
    this.currentNode.enter();

    return true;
  }

  public reset(): void {
    if (this.currentNode) {
      this.currentNode.exit();
    }
    this.currentNode = null;
  }
}