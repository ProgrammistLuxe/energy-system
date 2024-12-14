import { TreeNodeType } from '@api-calls/services/http-tree/models';

export class AttrsFlatNode {
  constructor(
    public id: string,
    public title: string,
    public parent: string,
    public level: number = 0,
    public type: TreeNodeType,
    public selectable: boolean = false,
    public expandable: boolean = false,
    public loading: boolean = false,
  ) {}
}
