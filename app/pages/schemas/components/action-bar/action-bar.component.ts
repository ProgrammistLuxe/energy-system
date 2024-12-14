import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { HttpDlpService } from '@api-calls/services';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';
import { NotificationsService } from '@services';
import { materialModules } from '@shared/index';
import { ReplaySubject, finalize, takeUntil } from 'rxjs';

@Component({
  selector: 'app-action-bar',
  imports: [
    CommonModule,
    materialModules.matButtonModule,
    materialModules.matIconModule,
    materialModules.matMenuModule,
  ],
  templateUrl: './action-bar.component.html',
  styleUrl: './action-bar.component.scss',
})
export class ActionBarComponent {
  @Output() clearGraph: EventEmitter<void> = new EventEmitter<void>();
  @Output() exportSvg: EventEmitter<void> = new EventEmitter<void>();
  @Output() exportPng: EventEmitter<void> = new EventEmitter<void>();
  @Output() exportPdf: EventEmitter<void> = new EventEmitter<void>();
  @Output() drawJsonLd: EventEmitter<void> = new EventEmitter<void>();
}
