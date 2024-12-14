import { AttrsNode, AttrsFlatNode } from '../models';

export function getCalculatedAttrsNode(node: AttrsNode): AttrsFlatNode {
  return new AttrsFlatNode(
    node.id,
    node.title,
    node.parent,
    node.level,
    node.type,
    node.selectable,
    node.hasChildren,
    false,
  );
}
export function getCalculatedAttrsNodes(nodes: AttrsNode[]): AttrsFlatNode[] {
  return nodes.map((node) => getCalculatedAttrsNode(node));
}
