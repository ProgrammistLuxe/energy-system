import { TreeNodeType } from '@api-calls/services/http-tree/models';

export interface AttrsNode {
  id: string;
  parent: string;
  title: string;
  level: number;
  hasChildren: boolean;
  type: TreeNodeType;
  selectable: boolean;
}
