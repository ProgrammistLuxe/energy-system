import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { downloadData } from '@core/utils/download-data';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';
import { PassportsTreeService } from '@features/passports-tree/services/passports-tree.service';
import { SchemasService } from '../../services/schemas.service';
import { NotificationsService } from '@services';
import { ButtonLoadingDirective, materialModules } from '@shared/index';
import { ReplaySubject, finalize, takeUntil } from 'rxjs';

@Component({
  selector: 'app-action-bar',
  imports: [
    CommonModule,
    ButtonLoadingDirective,
    materialModules.matButtonModule,
    materialModules.matIconModule,
    materialModules.matMenuModule,
  ],
  templateUrl: './action-bar.component.html',
  styleUrl: './action-bar.component.scss',
})
export class ActionBarComponent {
  @Output() clearGraph: EventEmitter<void> = new EventEmitter<void>();
  @Output() loadXml: EventEmitter<void> = new EventEmitter<void>();
  @Output() exportSvg: EventEmitter<void> = new EventEmitter<void>();
  @Output() exportPng: EventEmitter<void> = new EventEmitter<void>();
  @Output() exportPdf: EventEmitter<void> = new EventEmitter<void>();
  saveLoading: boolean = false;
  private destroy$: ReplaySubject<void> = new ReplaySubject<void>();
  constructor(
    private schemasService: SchemasService,
    private notificationsService: NotificationsService,
    private passportsTreeService: PassportsTreeService,
  ) {}
  exportSchema(value: string) {
    switch (value) {
      case 'png': {
        this.exportPng.emit();
        break;
      }
      case 'pdf': {
        this.exportPdf.emit();
        break;
      }
      case 'svg': {
        this.exportSvg.emit();
        break;
      }
    }
  }

  exportDlp() {
    if (!this.passportsTreeService.currentNode) {
      return;
    }
    this.saveLoading = true;
    this.schemasService
      .loadSchema(this.passportsTreeService.currentNode.id, 'xml')
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.saveLoading = false)),
      )
      .subscribe((response) => {
        if (!this.passportsTreeService.currentNode) {
          return;
        }
        if (response.error) {
          const errorMessage: string = getErrorsMessage(response.error) || 'Ошибка выгрузки';
          this.notificationsService.displayMessage('Ошибка', errorMessage, 'error', 3000);
          return;
        } else {
          downloadData(response.result.data, this.passportsTreeService.currentNode.title, 'application/xml');
          this.notificationsService.displayMessage('Успех', 'Выгружено успешно', 'success');
        }
      });
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
