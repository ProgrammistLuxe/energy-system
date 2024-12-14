import { Directive, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';

@Directive({
  selector: '[goBackButton]',
  standalone: true,
})
export class GoBackButtonDirective {
  @Input() iconsSize: number = 24;
  @Input() width: number = 48;
  @Input() height: number = 48;

  @HostListener('mouseover') onMouseOver() {
    this.elementRef.nativeElement.style.backgroundColor = ' var(--element-hover)';
  }
  @HostListener('mouseleave') onMouseLeave() {
    this.elementRef.nativeElement.style.backgroundColor = 'var(--element-active-bg)';
  }
  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2,
  ) {
    this.addIcon();
  }
  private addIcon() {
    const icon = this.renderer.createElement('mat-icon');
    this.renderer.addClass(icon, 'mat-icon');
    this.renderer.addClass(icon, 'material-icons');
    this.renderer.appendChild(icon, this.renderer.createText('arrow_back'));
    this.renderer.appendChild(this.elementRef.nativeElement, icon);
  }

  private appendStyles() {
    this.elementRef.nativeElement.style.display = 'flex';
    this.elementRef.nativeElement.style.justifyContent = 'center';
    this.elementRef.nativeElement.style.alignItems = 'center';
    this.elementRef.nativeElement.style.width = this.width + 'px';
    this.elementRef.nativeElement.style.height = this.height + 'px';
    this.elementRef.nativeElement.style.color = 'var(--light-blue-bg)';
    this.elementRef.nativeElement.style.backgroundColor = 'var(--element-active-bg)';
    this.elementRef.nativeElement.style.cursor = 'pointer';
    this.elementRef.nativeElement.style.borderRadius = '50%';
    const icon: HTMLElement | null = this.elementRef.nativeElement.querySelector('.mat-icon');
    if (!icon) {
      return;
    }
    icon.style.fontSize = this.iconsSize + 'px';
    icon.style.width = this.iconsSize + 'px';
    icon.style.height = this.iconsSize + 'px';
    icon.style.color = 'var(--text-color-light-blue)';
  }
  ngOnChanges() {
    this.appendStyles();
  }
  ngAfterViewInit() {
    this.appendStyles();
  }
}
