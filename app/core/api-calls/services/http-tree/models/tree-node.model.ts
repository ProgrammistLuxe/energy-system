import { TreeNodeType } from './tree-node-type';

export interface TreeNode {
  uid: string;
  name: string;
  hasChildren: boolean;
  tagClass: TreeNodeType;
  parentUid: string;
  passport: boolean;
  selectable: boolean;
  childrenList: TreeNode[];
}
