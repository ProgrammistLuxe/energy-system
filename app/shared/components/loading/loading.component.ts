import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { materialModules } from '@shared/materials';

@Component({
  selector: 'app-loading',
  imports: [CommonModule, materialModules.matProgressSpinnerModule],
  templateUrl: './loading.component.html',
  styleUrl: './loading.component.scss',
})
export class LoadingComponent {
  @Input() loading: boolean = false;
  @Input() diameter: number = 40;
}
