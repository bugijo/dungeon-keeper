import { DialogueGraph } from './DialogueGraph';
import { DialogueNode, DialogueOption } from './DialogueNode';

export interface DialogueTemplate {
  id: string;
  nodes: {
    id: string;
    text: string;
    options: DialogueOption[];
  }[];
  startNodeId: string;
}

export class DialogueManager {
  private dialogues: Map<string, DialogueGraph>;
  private activeDialogue: DialogueGraph | null;

  constructor() {
    this.dialogues = new Map();
    this.activeDialogue = null;
  }

  public createDialogue(template: DialogueTemplate): void {
    const graph = new DialogueGraph();

    template.nodes.forEach(nodeData => {
      const node = new DialogueNode(nodeData.id, nodeData.text, nodeData.options);
      graph.addNode(node);
    });

    this.dialogues.set(template.id, graph);
  }

  public startDialogue(dialogueId: string): boolean {
    const dialogue = this.dialogues.get(dialogueId);
    if (!dialogue) return false;

    this.activeDialogue = dialogue;
    return dialogue.start(dialogueId);
  }

  public getCurrentNode(): DialogueNode | null {
    return this.activeDialogue?.getCurrentNode() || null;
  }

  public selectOption(optionIndex: number): boolean {
    return this.activeDialogue?.selectOption(optionIndex) || false;
  }

  public endDialogue(): void {
    if (this.activeDialogue) {
      this.activeDialogue.reset();
      this.activeDialogue = null;
    }
  }

  public getDialogue(dialogueId: string): DialogueGraph | undefined {
    return this.dialogues.get(dialogueId);
  }

  public removeDialogue(dialogueId: string): boolean {
    return this.dialogues.delete(dialogueId);
  }
}