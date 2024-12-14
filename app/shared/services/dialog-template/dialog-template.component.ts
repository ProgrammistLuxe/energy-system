import { ComponentType } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ComponentRef,
  Inject,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { materialModules } from '@shared/materials';

export interface DialogServiceInstConfig {
  component: ComponentType<any> | null;
  disableCloseEsc: boolean;
  hideCloseButton: boolean;
  title: string;
}

@Component({
  selector: 'app-dialog-template',
  standalone: true,
  imports: [CommonModule, materialModules.matDialogModule, materialModules.matIconModule],
  templateUrl: './dialog-template.component.html',
  styleUrls: ['./dialog-template.component.scss'],
})
export class DialogTemplateComponent implements AfterViewInit {
  @ViewChild('container', { read: ViewContainerRef, static: true }) public container: ViewContainerRef | undefined;
  componentRef: ComponentRef<any> | null = null;
  dialogServiceConfig: DialogServiceInstConfig = {
    component: null,
    disableCloseEsc: true,
    hideCloseButton: false,
    title: '',
  };

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<DialogTemplateComponent>,
    private ref: ChangeDetectorRef,
  ) {}

  ngAfterViewInit() {
    if (this.dialogServiceConfig.component && this.container) {
      this.componentRef = this.container.createComponent(this.dialogServiceConfig.component);
      this.ref.detectChanges();
    }
  }
}
