import { ComponentRef, Directive, ElementRef, Input, Renderer2, SimpleChanges, ViewContainerRef } from '@angular/core';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Directive({
  selector: '[buttonLoading]',
  standalone: true,
})
export class ButtonLoadingDirective {
  @Input('buttonLoading') buttonLoading: boolean = false;
  @Input() isIconButton: boolean = false;
  spinner: ComponentRef<MatProgressSpinner> | null = null;
  oldStyles: CSSStyleDeclaration | null = null;
  alwaysDisabled: boolean = false;
  constructor(
    private elementRef: ElementRef,
    private viewContainer: ViewContainerRef,
    private renderer: Renderer2,
  ) {}

  private setButtonState() {
    if (this.buttonLoading) {
      this.addSpinner();
    } else {
      this.removeSpinner();
    }
  }
  private setStyles() {
    if (!this.elementRef.nativeElement) {
      return;
    }

    this.renderer.setStyle(this.elementRef.nativeElement, 'pointer-events', 'none');
    this.renderer.setStyle(this.elementRef.nativeElement, 'cursor', 'wait');
    this.renderer.setProperty(this.elementRef.nativeElement, 'disabled', true);

    if (!this.isIconButton) {
      this.renderer.setStyle(this.elementRef.nativeElement, 'display', 'flex');
      this.renderer.setStyle(this.elementRef.nativeElement, 'align-items', 'center');
      this.renderer.setStyle(this.elementRef.nativeElement, 'gap', '10px');
      this.oldStyles = { ...this.elementRef.nativeElement.style };
    } else {
      const icon = this.elementRef.nativeElement.querySelector('.mat-icon');
      if (!icon) {
        return;
      }
      this.renderer.setStyle(icon, 'display', 'none');
    }
  }
  private removeStyles() {
    if (!this.elementRef.nativeElement) {
      return;
    }
    if (!this.alwaysDisabled) {
      this.renderer.setProperty(this.elementRef.nativeElement, 'disabled', false);
    }

    if (this.isIconButton) {
      const icon = this.elementRef.nativeElement.querySelector('.mat-icon');
      if (!icon) {
        return;
      }
      this.renderer.setStyle(this.elementRef.nativeElement, 'pointer-events', 'all');
      this.renderer.setStyle(this.elementRef.nativeElement, 'cursor', 'pointer');
      this.renderer.setProperty(this.elementRef.nativeElement, 'disabled', false);
      this.renderer.setStyle(icon, 'display', 'block');
    } else if (this.oldStyles) {
      this.renderer.setProperty(this.elementRef.nativeElement, 'disabled', false);
      this.renderer.setProperty(this.elementRef.nativeElement, 'style', this.oldStyles);
    }
  }
  private addSpinner() {
    this.setStyles();
    this.spinner = this.viewContainer.createComponent(MatProgressSpinner);
    this.renderer.setStyle(this.spinner.location.nativeElement, 'z-index', '1');
    this.renderer.setStyle(this.spinner.location.nativeElement, 'position', 'relative');
    this.renderer.setAttribute(this.spinner.location.nativeElement, 'class', 'button-loader');
    this.spinner.instance.diameter = 20;
    this.spinner.instance.mode = 'indeterminate';

    this.renderer.appendChild(this.elementRef.nativeElement, this.spinner.location.nativeElement);
  }
  private removeSpinner() {
    if (this.spinner) {
      this.spinner.destroy();
      this.renderer.removeAttribute(this.spinner.location.nativeElement, 'class', 'button-loader');
      this.spinner = null;
    }
    this.removeStyles();
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['buttonLoading'].firstChange) {
      return;
    }
    this.setButtonState();
  }
  ngAfterViewInit() {
    if (this.elementRef.nativeElement.disabled) {
      this.alwaysDisabled = true;
    }
    this.setButtonState();
  }
}
