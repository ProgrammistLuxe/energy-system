import { ComponentType } from '@angular/cdk/portal';
import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DialogServiceConfig } from '@core/models/dialog-service-config.model';
import { DialogTemplateComponent } from '@shared/components';

export class DialogTemplateConfig {
  component!: ComponentType<any>;
  disableCloseEsc?: boolean;
  hideCloseButton?: boolean;
  title?: string;
}
export interface DialogTemplate {
  dialogServiceConfig: DialogTemplateConfig;
}

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  constructor(
    private dialog: MatDialog,
    private rendererFactory2: RendererFactory2,
  ) {
    const renderer: Renderer2 = this.rendererFactory2.createRenderer(document, null);
    renderer.listen('document', 'keydown.escape', () => {
      if (this.dialog.openDialogs.length > 0) {
        const dialogItem = this.dialog.openDialogs[this.dialog.openDialogs.length - 1];
        if (!dialogItem.componentInstance.dialogServiceConfig.disableCloseEsc) {
          dialogItem.close();
        }
      }
    });
  }

  private mdDialogRef: MatDialogRef<DialogTemplate> | null = null;

  open<T>(component: ComponentType<T>, config: DialogServiceConfig): MatDialogRef<DialogTemplate> {
    this.mdDialogRef = this.dialog.open(DialogTemplateComponent, config) as MatDialogRef<DialogTemplate>;
    this.mdDialogRef.componentInstance.dialogServiceConfig = {
      component: component,
      disableCloseEsc: config?.disableCloseEsc,
      hideCloseButton: config?.hideCloseButton,
      title: config?.title,
    };
    return this.mdDialogRef;
  }

  closeAll() {
    if (!this.mdDialogRef) {
      return;
    }
    this.mdDialogRef.close();
  }
}
