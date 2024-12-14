import { AfterViewInit, Directive, ElementRef, Input, OnDestroy, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appCheckScroll]',
  standalone: true,
})
export class CheckScrollDirective implements AfterViewInit, OnDestroy {
  @Input() appCheckScroll: HTMLAnchorElement | null = null;
  container: HTMLElement | null = null;
  constructor(
    private eleRef: ElementRef,
    private renderer: Renderer2,
  ) {}
  private observer = new ResizeObserver(() => {
    if (this.eleRef.nativeElement.offsetHeight < this.eleRef.nativeElement.scrollHeight) {
      this.renderer.setStyle(this.container, 'padding-right', '10px');
    } else {
      this.renderer.removeStyle(this.container, 'padding-right');
    }
  });
  ngAfterViewInit() {
    if (!this.appCheckScroll) {
      this.container = this.eleRef.nativeElement;
    } else {
      this.container = this.appCheckScroll;
    }
    if (!this.container) {
      return;
    }
    this.observer.observe(this.container);
  }
  ngOnDestroy(): void {
    if (!this.container) {
      return;
    }
    this.observer.unobserve(this.container);
  }
}
