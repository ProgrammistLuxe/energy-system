import { Directive, ElementRef, HostBinding, Input } from '@angular/core';

@Directive({
  selector: '[matIconButtonCustom]',
  standalone: true,
})
export class MatIconButtonCustomDirective {
  @Input() disabled: boolean = false;
  @Input() iconsSize: number = 24;
  @HostBinding('style.width.px') @Input() width: number = 48;
  @HostBinding('style.height.px') @Input() height: number = 48;
  @HostBinding('style.minWidth.px') minWidth: number = 0;

  constructor(private elementRef: ElementRef) {}

  private appendStyles() {
    this.elementRef.nativeElement.style.display = 'flex';
    this.elementRef.nativeElement.style.justifyContent = 'center';
    this.elementRef.nativeElement.style.alignItems = 'center';
    this.elementRef.nativeElement.style.padding = '0';
    const icon: HTMLElement | null = this.elementRef.nativeElement.querySelector('.mat-icon');
    if (!icon) {
      return;
    }
    icon.style.fontSize = this.iconsSize + 'px';
    icon.style.width = this.iconsSize + 'px';
    icon.style.height = this.iconsSize + 'px';
    icon.style.marginRight = 0 + 'px';
    icon.style.color = 'var(--text-color)';
    const childElement: HTMLElement | null =
      this.elementRef.nativeElement.querySelector('.mat-mdc-button-touch-target');
    if (!childElement) {
      return;
    }
    childElement.style.width = this.width + 'px';
    childElement.style.height = this.height + 'px';
  }
  ngOnChanges() {
    this.appendStyles();
  }
  ngAfterViewInit() {
    this.appendStyles();
  }
}
