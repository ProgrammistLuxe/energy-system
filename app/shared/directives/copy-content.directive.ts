import { Directive, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { NotificationsService } from '@services';
import { MatTooltip } from '@angular/material/tooltip';
@Directive({
  selector: '[appCopyContent]',
  providers: [MatTooltip],
  standalone: true,
})
export class CopyContentDirective {
  @Input('appCopyContent') content: string | number | null = null;
  private icon: HTMLElement | null = null;
  constructor(
    private clipboard: Clipboard,
    private elementRef: ElementRef<HTMLElement>,
    private renderer: Renderer2,
    private tooltip: MatTooltip,
    private notificationsService: NotificationsService,
  ) {}
  private addIcon() {
    this.icon = this.renderer.createElement('mat-icon');
    this.renderer.addClass(this.icon, 'mat-icon');
    this.renderer.addClass(this.icon, 'material-symbols-outlined');
    this.renderer.appendChild(this.icon, this.renderer.createText('content_copy'));
    if (!this.icon) {
      return;
    }
    this.icon.onclick = () => this.copyContent();
    this.tooltip.message = 'Копировать содержимое';
    this.tooltip.position = 'below';
    this.icon.onmouseover = () => this.tooltip.show();
    this.icon.onmouseleave = () => this.tooltip.hide();
    this.icon.style.cursor = 'pointer';
    this.renderer.appendChild(this.elementRef.nativeElement, this.icon);
  }

  private setStyle() {
    this.elementRef.nativeElement.style.display = 'flex';
    this.elementRef.nativeElement.style.justifyContent = 'flex-start';
    this.elementRef.nativeElement.style.gap = '5px';
    this.elementRef.nativeElement.style.padding = '0 5px';
    this.elementRef.nativeElement.style.alignItems = 'center';
  }
  private copyContent() {
    if (!this.content) {
      return;
    }
    this.clipboard.copy(String(this.content));
    this.notificationsService.displayMessage('Успех', 'Успешно скопированно в буфер обмена', 'success', 3000);
  }
  ngAfterViewInit() {
    this.addIcon();
    this.setStyle();
  }
}
