import { Directive, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appAddButton]',
  standalone: true,
})
export class AddButtonDirective {
  @Input() disabled: boolean = false;

  @HostListener('mouseover') onMouseOver() {
    this.elementRef.nativeElement.style.backgroundColor = ' var(--light-blue-bg-lighten)';
  }
  @HostListener('mouseleave') onMouseLeave() {
    this.elementRef.nativeElement.style.backgroundColor = 'var(--light-blue-bg)';
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
    this.renderer.addClass(icon, 'material-symbols-outlined');
    this.renderer.appendChild(icon, this.renderer.createText('add'));
    this.renderer.appendChild(this.elementRef.nativeElement, icon);
  }
  private appendDefaultStyles() {
    this.elementRef.nativeElement.style.minWidth = '32px';
    this.elementRef.nativeElement.style.minHeight = '32px';
    this.elementRef.nativeElement.style.display = 'flex';
    this.elementRef.nativeElement.style.justifyContent = 'center';
    this.elementRef.nativeElement.style.alignItems = 'center';
    this.elementRef.nativeElement.style.borderRadius = '4px';
    this.elementRef.nativeElement.style.color = 'var(--text-white)';
    this.elementRef.nativeElement.style.backgroundColor = 'var(--light-blue-bg)';
    this.elementRef.nativeElement.style.cursor = 'pointer';
    this.elementRef.nativeElement.style.pointerEvents = 'all';
  }
  private appendStyles() {
    this.appendDefaultStyles();
    if (this.disabled) {
      this.elementRef.nativeElement.style.cursor = 'crosshair';
      this.elementRef.nativeElement.style.pointerEvents = 'none';
    }
  }
  ngOnChanges() {
    this.appendStyles();
  }
  ngAfterViewInit() {
    this.appendStyles();
  }
}
