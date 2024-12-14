import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';

@Directive({
  selector: '[overflowTooltip]',
  providers: [MatTooltip],
  standalone: true,
})
export class OverFlowTooltipDirective {
  @Input() overflowTooltip: string = '';
  @Input() overflowTooltipPosition: 'left' | 'right' | 'above' | 'below' | 'before' | 'after' = 'below';
  @Input() overflowContainer?: HTMLAnchorElement;
  constructor(
    private eleRef: ElementRef,
    private tooltip: MatTooltip,
  ) {}
  @HostListener('mouseover') mouseover() {
    this.tooltip.hide();
    const container = this.overflowContainer ? this.overflowContainer : this.eleRef.nativeElement;
    if (container.offsetWidth < container.scrollWidth) {
      this.tooltip.message = this.overflowTooltip;
      this.tooltip.position = this.overflowTooltipPosition;
      this.tooltip.show();
    }
  }
  @HostListener('mouseleave') mouseleave() {
    this.tooltip.hide();
  }
}
