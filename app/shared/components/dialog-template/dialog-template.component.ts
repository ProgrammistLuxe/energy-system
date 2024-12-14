import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ComponentRef,
  forwardRef,
  Inject,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { materialModules, OverFlowTooltipDirective } from '@shared/index';
import { DialogTemplateConfig } from '@shared/services';

@Component({
  selector: 'app-dialog-template',
  imports: [
    materialModules.matIconModule,
    materialModules.matDialogModule,
    forwardRef(() => OverFlowTooltipDirective),
    CommonModule,
  ],
  templateUrl: './dialog-template.component.html',
  styleUrl: './dialog-template.component.scss',
})
export class DialogTemplateComponent {
  @ViewChild('container', { read: ViewContainerRef }) public container: ViewContainerRef | null = null;
  componentRef: ComponentRef<any> | null = null;
  dialogServiceConfig: DialogTemplateConfig = new DialogTemplateConfig();
  constructor(
    public dialogRef: MatDialogRef<DialogTemplateComponent>,
    private ref: ChangeDetectorRef,
  ) {}
  ngAfterViewInit() {
    this.componentRef = this.container?.createComponent(this.dialogServiceConfig?.component) ?? null;
    this.ref.detectChanges();
  }
}
