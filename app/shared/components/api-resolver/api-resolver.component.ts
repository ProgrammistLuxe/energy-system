import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, HostListener, Input, OnChanges, Output } from '@angular/core';
import { EmptyTemplateComponent, materialModules } from '@shared/index';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
@Component({
  selector: '[api-resolver]',
  templateUrl: './api-resolver.component.html',
  styleUrls: ['./api-resolver.component.scss'],
  imports: [
    CommonModule,
    materialModules.matIconModule,
    materialModules.matButtonModule,
    materialModules.matProgressSpinnerModule,
    EmptyTemplateComponent,
    NgxSkeletonLoaderModule,
  ],
})
export class ApiResolverComponent implements OnChanges {
  @Input() loading: boolean = false;
  @Input() isSkeleton: boolean = false;
  @Input() errorCode: number | null = null;
  @Input() title: string = 'Данные не получены';
  @Input() errorMessage: string | null = null;
  @Output() reload: EventEmitter<boolean> = new EventEmitter();
  @HostListener('resize')
  onResize() {
    this.calculateSkeletonCount();
  }
  constructor(private cd: ChangeDetectorRef) {}
  hasError: boolean = false;
  count: number = 0;
  private calculateSkeletonCount() {
    if (!this.isSkeleton) {
      return;
    }
    const skeletonBlock = document.querySelector('.skeleton');
    if (!skeletonBlock) {
      return;
    }
    this.count = Math.round((skeletonBlock.clientHeight - 15) / 24);
    if (this.count <= 0) {
      this.count = 18;
    }
    this.cd.detectChanges();
  }
  ngOnChanges() {
    this.hasError = this.errorCode !== null ? true : false;
    this.calculateSkeletonCount();
    this.cd.detectChanges();
  }
  ngAfterViewInit() {
    this.calculateSkeletonCount();
  }
}
