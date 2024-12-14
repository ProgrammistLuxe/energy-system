import { TreeNode } from './tree-node.model';

export interface GetBaseNodeRes {
  uid: string;
  name: string;
  hasChildren: boolean;
  tagClass: string;
  parentUid: string;
  passport: boolean;
  selectable: boolean;
  childrenList: TreeNode[];
}
