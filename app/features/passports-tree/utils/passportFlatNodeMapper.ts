import { PassportFlatNode, PassportNode } from '../models';

export function getCalculatedPassportNode(node: PassportNode): PassportFlatNode {
  return new PassportFlatNode(
    node.id,
    node.title,
    node.parent,
    node.level,
    node.type,
    node.passport,
    node.hasChildren,
    false,
  );
}
export function getCalculatedPassportNodes(nodes: PassportNode[]): PassportFlatNode[] {
  return nodes.map((node) => getCalculatedPassportNode(node));
}
