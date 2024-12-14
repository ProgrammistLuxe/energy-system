import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { materialModules, MatIconButtonCustomDirective } from '@shared/index';

@Component({
  selector: 'app-schemas-footer',
  imports: [
    CommonModule,
    MatIconButtonCustomDirective,
    materialModules.matButtonModule,
    materialModules.matIconModule,
    materialModules.matTooltipModule,
  ],
  templateUrl: './schemas-footer.component.html',
  styleUrl: './schemas-footer.component.scss',
})
export class SchemasFooterComponent {
  @Input() scale: number = 1;
  @Input() minScale: number = 0.1;
  @Input() maxScale: number = 3;
  @Output() zoomChanged: EventEmitter<number> = new EventEmitter<number>();
  @Output() fullScreenToggle: EventEmitter<void> = new EventEmitter<void>();
  fullScreen: boolean = false;

  toggleFullScreen() {
    this.fullScreen = !this.fullScreen;
    this.fullScreenToggle.emit();
  }
  zoomIn() {
    this.scale += 0.1;
    this.zoomChanged.emit(this.scale);
  }
  zoomOut() {
    this.scale -= 0.1;
    this.zoomChanged.emit(this.scale);
  }
}
