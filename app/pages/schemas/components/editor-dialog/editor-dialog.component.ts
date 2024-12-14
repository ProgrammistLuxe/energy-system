import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { materialModules } from '@shared/index';

@Component({
  selector: 'app-editor-dialog',
  imports: [CommonModule, materialModules.matButtonModule, materialModules.matDialogModule],
  templateUrl: './editor-dialog.component.html',
  styleUrl: './editor-dialog.component.scss',
})
export class EditorDialogComponent {
  constructor(private dialogRef: MatDialogRef<EditorDialogComponent>) {}
  jsonLd: Record<string, any>[] = [];
  handleFileSelect(event: any) {
    if (!event.target || !event.target?.files?.length) {
      return;
    }
    const reader = new FileReader();
    reader.onload = (e: any) => (this.jsonLd = JSON.parse(e.currentTarget.result));
    reader.readAsText(event.target.files[0]);
  }
  draw() {
    if (!this.jsonLd.length) {
      return;
    }
    this.dialogRef.close(this.jsonLd);
  }
}
