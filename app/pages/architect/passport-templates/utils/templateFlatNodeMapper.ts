import { TemplateFlatNode } from '../models';
import { PassTemplateNode } from '../models/pass-template-node.models';

export function getCalculatedTemplateNode(node: PassTemplateNode): TemplateFlatNode {
  return new TemplateFlatNode(
    node.id,
    node.type + '/' + node.id,
    node.title,
    node.parent,
    node.level,
    node.type,
    !!node.hasChildren,
    false,
  );
}
export function getCalculatedTemplateNodes(nodes: PassTemplateNode[]): TemplateFlatNode[] {
  return nodes.map((node) => getCalculatedTemplateNode(node));
}
