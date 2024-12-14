import { TreeNodeType } from '@api-calls/services/http-tree/models';

export interface PassportNode {
  id: string;
  parent: string;
  title: string;
  level: number;
  hasChildren: boolean;
  type: TreeNodeType;
  passport: boolean;
}
