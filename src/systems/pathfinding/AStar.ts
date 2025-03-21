import { Node } from './Node';
import { Grid } from './Grid';

export class AStar {
  private grid: Grid;

  constructor(grid: Grid) {
    this.grid = grid;
  }

  public findPath(startX: number, startY: number, endX: number, endY: number): Node[] {
    const startNode = this.grid.getNode(startX, startY);
    const endNode = this.grid.getNode(endX, endY);

    if (!startNode || !endNode || !startNode.walkable || !endNode.walkable) {
      return [];
    }

    this.grid.resetNodes();

    const openSet: Node[] = [startNode];
    const closedSet: Set<Node> = new Set();

    while (openSet.length > 0) {
      let currentNode = this.getLowestFCostNode(openSet);

      if (currentNode.equals(endNode)) {
        return this.retracePath(startNode, currentNode);
      }

      openSet.splice(openSet.indexOf(currentNode), 1);
      closedSet.add(currentNode);

      for (const neighbor of this.grid.getNeighbors(currentNode)) {
        if (closedSet.has(neighbor)) continue;

        const movementCost = currentNode.g + this.getDistance(currentNode, neighbor);

        if (movementCost < neighbor.g || !openSet.includes(neighbor)) {
          neighbor.g = movementCost;
          neighbor.h = this.getDistance(neighbor, endNode);
          neighbor.f = neighbor.g + neighbor.h;
          neighbor.parent = currentNode;

          if (!openSet.includes(neighbor)) {
            openSet.push(neighbor);
          }
        }
      }
    }

    return [];
  }

  private getLowestFCostNode(nodes: Node[]): Node {
    let lowestNode = nodes[0];
    for (let i = 1; i < nodes.length; i++) {
      if (nodes[i].f < lowestNode.f) {
        lowestNode = nodes[i];
      }
    }
    return lowestNode;
  }

  private getDistance(nodeA: Node, nodeB: Node): number {
    const distX = Math.abs(nodeA.x - nodeB.x);
    const distY = Math.abs(nodeA.y - nodeB.y);

    if (distX > distY) {
      return 14 * distY + 10 * (distX - distY);
    }
    return 14 * distX + 10 * (distY - distX);
  }

  private retracePath(startNode: Node, endNode: Node): Node[] {
    const path: Node[] = [];
    let currentNode: Node | null = endNode;

    while (currentNode && !currentNode.equals(startNode)) {
      path.push(currentNode);
      currentNode = currentNode.parent;
    }

    path.push(startNode);
    return path.reverse();
  }
}