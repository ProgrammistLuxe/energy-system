import { Directive, ElementRef, HostListener, Input, Renderer2, ViewContainerRef } from '@angular/core';
import { AttributesLinkData } from '@api-calls/services/http-graph-service/models';
import { DialogService } from '@shared/index';
import { ShowPropertiesDialogComponent } from '../components/show-properties-dialog/show-properties-dialog.component';
import { ActivatedRoute } from '@angular/router';

@Directive({
  selector: '[showAllProperties]',
  standalone: true,
})
export class ShowAllPropertiesDirective {
  @Input('showAllProperties') data: AttributesLinkData[] = [];
  private showEl: HTMLParagraphElement | null = null;
  constructor(
    private eleRef: ElementRef<HTMLDivElement>,
    private dialogService: DialogService,
    private renderer: Renderer2,
    private route: ActivatedRoute,
  ) {}
  @HostListener('mouseover') mouseover() {
    if (this.showEl) {
      return;
    }
    const container = this.eleRef.nativeElement;
    if (container.offsetHeight < container.scrollHeight) {
      this.showEl = this.renderer.createElement('p');
      if (!this.showEl) {
        return;
      }
      this.showEl.textContent = 'Показать все';
      this.showEl.style.color = 'var(--text-color)';
      this.showEl.style.position = 'absolute';
      this.showEl.style.right = '2px';
      this.showEl.onclick = (e) => this.handleClick(e);
      this.eleRef.nativeElement.style.paddingRight = '95px';
      this.renderer.appendChild(this.eleRef.nativeElement, this.showEl);
    }
  }
  @HostListener('mouseleave') mouseleave() {
    this.eleRef.nativeElement.style.paddingRight = '0px';
    if (!this.showEl) {
      return;
    }
    this.showEl.remove();
    this.renderer.removeChild(this.eleRef.nativeElement, this.showEl);
    this.showEl = null;
  }
  private handleClick(e: Event) {
    e.stopPropagation();
    this.dialogService.open<ShowPropertiesDialogComponent>(ShowPropertiesDialogComponent, {
      width: '480px',
      title: 'Значения элемента',
      data: { links: this.data, route: this.route },
    });
  }
}
