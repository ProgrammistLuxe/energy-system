import { SortDirection } from '@angular/material/sort';

export interface TableOrdering {
  column: string;
  direction: SortDirection;
  string: string;
}
