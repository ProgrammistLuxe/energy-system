import { TreeNodeType } from './tree-node-type.model';

export interface PassTemplateNode {
  id: number;
  parent: number;
  title: string;
  level: number;
  hasChildren: boolean;
  type: TreeNodeType;
}
