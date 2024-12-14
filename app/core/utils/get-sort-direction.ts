import { Sort } from '@angular/material/sort';

export function getSortDirection(event: Sort): string {
  if (event.direction === 'asc') return event.active;
  if (event.direction === 'desc') return '-' + event.active;
  return '';
}
