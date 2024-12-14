import { CommonModule } from '@angular/common';
import { Component, Host, forwardRef } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import { MatFormField } from '@angular/material/form-field';
import { MatIconButtonCustomDirective, materialModules } from '@shared/index';

@Component({
  selector: 'clear-field-button',
  template: ` <button
    class="clear-btn"
    mat-icon-button
    matIconButtonCustom
    matTooltip="Очистить поле"
    [width]="30"
    [height]="30"
    [iconsSize]="24"
    [disabled]="!control?.value"
    (click)="$event.stopPropagation(); control?.reset()">
    <mat-icon>close</mat-icon>
  </button>`,
  styles: [
    `
      :host {
        display: block;
        width: min-content;
        height: min-content;
      }
      .clear-btn {
        margin-right: 10px;
      }
    `,
  ],
  imports: [
    materialModules.matIconModule,
    materialModules.matTooltipModule,
    materialModules.matIconModule,
    forwardRef(() => MatIconButtonCustomDirective),
    MatIconButton,
    CommonModule,
  ],
})
export class ClearFieldButtonDirective {
  control: AbstractControl | null = null;
  constructor(@Host() private parent: MatFormField) {}
  ngAfterViewInit() {
    this.control = this.parent._control.ngControl?.control ?? null;
  }
}
