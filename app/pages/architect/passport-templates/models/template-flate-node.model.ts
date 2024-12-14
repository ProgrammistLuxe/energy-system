import { TreeNodeType } from './tree-node-type.model';

export class TemplateFlatNode {
  constructor(
    public id: number,
    public nodeId: string,
    public title: string,
    public parent: number,
    public level = 0,
    public type: TreeNodeType = 'folder',
    public expandable = false,
    public loading = false,
  ) {}
}
