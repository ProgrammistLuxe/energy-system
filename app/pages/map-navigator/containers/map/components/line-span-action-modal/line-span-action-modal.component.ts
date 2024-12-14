import { Component, HostListener } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatErrorExtComponent, materialModules } from '@shared/index';

@Component({
  selector: 'app-line-span-action-modal',
  imports: [
    materialModules.reactiveFormsModule,
    materialModules.matFormFieldModule,
    materialModules.matSelectModule,
    materialModules.matButtonModule,
    materialModules.matIconModule,
    materialModules.matDialogModule,
    MatErrorExtComponent,
  ],
  templateUrl: './line-span-action-modal.component.html',
  styleUrl: './line-span-action-modal.component.scss',
})
export class LineSpanActionModalComponent {
  @HostListener('click', ['$event']) onClick(e: MouseEvent) {
    e.stopPropagation();
  }
  actionControl: FormControl<string> = new FormControl<string>('', {
    validators: [Validators.required],
    nonNullable: true,
  });

  constructor(private dialogRef: MatDialogRef<LineSpanActionModalComponent>) {}

  selectAction() {
    this.dialogRef.close(this.actionControl.value);
  }
}
