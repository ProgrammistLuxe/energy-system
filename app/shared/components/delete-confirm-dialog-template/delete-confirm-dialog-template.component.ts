import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { materialModules } from '@shared/index';
@Component({
  selector: 'app-delete-confirm-dialog-template',
  standalone: true,
  imports: [materialModules.matDialogModule, materialModules.matButtonModule],
  templateUrl: './delete-confirm-dialog-template.component.html',
  styleUrl: './delete-confirm-dialog-template.component.scss',
})
export class DeleteConfirmDialogTemplateComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: string) {}
}
