import { MatDialogConfig } from '@angular/material/dialog';

export class DialogServiceConfig extends MatDialogConfig {
  disableCloseEsc?: boolean;
  hideCloseButton?: boolean;
  title?: string;
}
