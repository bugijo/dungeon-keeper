import { DialogueTemplate } from './DialogueManager';
import { DialogueOption } from './DialogueNode';

export class DialogueBuilder {
  private nodes: Map<string, {
    text: string;
    options: DialogueOption[];
  }>;
  private startNodeId: string | null;

  constructor() {
    this.nodes = new Map();
    this.startNodeId = null;
  }

  public addNode(id: string, text: string): DialogueBuilder {
    this.nodes.set(id, { text, options: [] });
    if (!this.startNodeId) {
      this.startNodeId = id;
    }
    return this;
  }

  public addOption(nodeId: string, option: DialogueOption): DialogueBuilder {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.options.push(option);
    }
    return this;
  }

  public setStartNode(nodeId: string): DialogueBuilder {
    if (this.nodes.has(nodeId)) {
      this.startNodeId = nodeId;
    }
    return this;
  }

  public build(id: string): DialogueTemplate {
    if (!this.startNodeId || this.nodes.size === 0) {
      throw new Error('Cannot build dialogue: no nodes or start node not set');
    }

    return {
      id,
      nodes: Array.from(this.nodes.entries()).map(([id, data]) => ({
        id,
        text: data.text,
        options: data.options
      })),
      startNodeId: this.startNodeId
    };
  }
}