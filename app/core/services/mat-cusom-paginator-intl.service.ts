import { Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { Subject } from 'rxjs';

@Injectable()
export class MyCustomPaginatorIntl implements MatPaginatorIntl {
  changes = new Subject<void>();
  firstPageLabel = 'Перейти на первую страницу';
  itemsPerPageLabel = 'Элементов на странице:';
  lastPageLabel = 'Перейти на последнюю страницу';
  nextPageLabel = 'Следующая страница';
  previousPageLabel = 'Предыдущая страница';

  getRangeLabel(page: number, pageSize: number, length: number): string {
    if (!length) {
      return 'Страница 1 из 1';
    }
    const amountPages = Math.ceil(length / pageSize);
    return `Страница ${page + 1} из ${amountPages}`;
  }
}
