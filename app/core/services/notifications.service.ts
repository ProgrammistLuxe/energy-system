import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig, MatSnackBarRef } from '@angular/material/snack-bar';
import { SnackbarCustomComponent } from '@shared/index';

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  constructor(private snackBar: MatSnackBar) {}

  displayMessage(
    header: string,
    message: string,
    type: 'info' | 'error' | 'success',
    duration: number = 0,
  ): MatSnackBarRef<SnackbarCustomComponent> {
    const config: MatSnackBarConfig = {
      data: {
        message,
        header,
        type,
      },
      horizontalPosition: 'right',
      verticalPosition: 'top',
      duration,
      panelClass: [`snackbar`],
      politeness: 'off',
    };
    return this.snackBar.openFromComponent(SnackbarCustomComponent, config);
  }

  dismiss() {
    this.snackBar.dismiss();
  }
}
