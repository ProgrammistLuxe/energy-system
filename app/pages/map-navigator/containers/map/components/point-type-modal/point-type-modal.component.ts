import { Component, HostListener } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatErrorExtComponent, materialModules } from '@shared/index';

@Component({
  selector: 'app-point-type-modal',
  imports: [
    materialModules.reactiveFormsModule,
    materialModules.matFormFieldModule,
    materialModules.matSelectModule,
    materialModules.matButtonModule,
    materialModules.matIconModule,
    materialModules.matDialogModule,
    MatErrorExtComponent,
  ],
  templateUrl: './point-type-modal.component.html',
  styleUrl: './point-type-modal.component.scss',
})
export class PointTypeModalComponent {
  @HostListener('click', ['$event']) onClick(e: MouseEvent) {
    e.stopPropagation();
  }
  typeControl: FormControl<string> = new FormControl<string>('', {
    validators: [Validators.required],
    nonNullable: true,
  });

  constructor(private dialogRef: MatDialogRef<PointTypeModalComponent>) {}
  selectType() {
    this.dialogRef.close(this.typeControl.value);
  }
}
