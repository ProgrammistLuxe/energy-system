import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { materialModules } from '@shared/index';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
interface SnackBarData {
  header: string;
  message: string;
  type: 'info' | 'success' | 'error';
}
@Component({
  selector: 'app-snackbar-custom',
  imports: [
    CommonModule,
    materialModules.matIconModule,
    materialModules.matProgressSpinnerModule,
    materialModules.matButtonModule,
  ],
  templateUrl: './snackbar-custom.component.html',
  styleUrl: './snackbar-custom.component.scss',
})
export class SnackbarCustomComponent {
  header: string = '';
  message: string = '';
  type: 'info' | 'success' | 'error' = 'info';
  iconType: 'done' | 'close' | 'info_i' = 'info_i';

  constructor(
    public snackBarRef: MatSnackBarRef<SnackbarCustomComponent>,
    @Inject(MAT_SNACK_BAR_DATA) public data: SnackBarData,
  ) {}
  private setIconType() {
    switch (this.type) {
      case 'error': {
        this.iconType = 'close';
        break;
      }
      case 'info': {
        this.iconType = 'info_i';
        break;
      }
      case 'success': {
        this.iconType = 'done';
        break;
      }
      default:
        this.iconType = 'info_i';
    }
  }
  ngOnInit(): void {
    this.message = this.data.message;
    this.header = this.data.header;
    this.type = this.data.type;
    this.setIconType();
  }
}
