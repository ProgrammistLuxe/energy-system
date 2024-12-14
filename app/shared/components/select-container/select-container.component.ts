/** Обертка для структруизации контента mat-select
    app-select-header - Фильтрация
    app-select-options - контейнер для mat-option
    app-select-footer - кнопки создания и пр
 */

import { Component } from '@angular/core';
import { materialModules } from '@shared/materials';

@Component({
  selector: 'app-select-container',
  templateUrl: './select-container.component.html',
  imports: [materialModules.matDividerModule],
  styleUrls: ['./select-container.component.scss'],
})
export class SelectContainerComponent {}
