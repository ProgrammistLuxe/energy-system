import { Directive, ElementRef, Input, Renderer2, SimpleChanges } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { UserStateService } from '@core/services/user-state.service';

@Directive({
  selector: '[appCheckPermissions]',
  standalone: true,
  providers: [MatTooltip],
})
export class CheckPermissionsDirective {
  constructor(
    private elementRef: ElementRef,
    private userService: UserStateService,
    private tooltip: MatTooltip,
    private renderer: Renderer2,
  ) {}
  @Input('appCheckPermissions') permissions: string[] = [];
  private accessDenied: boolean = false;
  private parentNode: HTMLElement | null = null;

  private checkState() {
    if (!this.elementRef) {
      return;
    }
    if (!this.userService.userValue) {
      this.renderer.setProperty(this.elementRef.nativeElement, 'disabled', true);
      this.renderer.setStyle(this.elementRef.nativeElement, 'pointer-events', 'none');
      this.accessDenied = true;
      this.insertParent();
      return;
    }
    if (!this.permissions.length) {
      this.renderer.setProperty(this.elementRef.nativeElement, 'disabled', false);
      this.renderer.setStyle(this.elementRef.nativeElement, 'pointer-events', 'all');
      this.accessDenied = false;
      this.removeParent();
      return;
    }
    const hasPermission = this.userService.userValue.permissions.some((permission) =>
      this.permissions.includes(permission),
    );
    if (hasPermission) {
      this.renderer.setProperty(this.elementRef.nativeElement, 'disabled', false);
      this.renderer.setStyle(this.elementRef.nativeElement, 'pointer-events', 'all');
      this.accessDenied = false;
      this.removeParent();
      return;
    }
    this.renderer.setProperty(this.elementRef.nativeElement, 'disabled', true);
    this.renderer.setStyle(this.elementRef.nativeElement, 'pointer-events', 'none');
    this.accessDenied = true;
    this.insertParent();
  }
  private removeParent() {
    if (!this.parentNode) {
      return;
    }
    const elementParent = this.renderer.parentNode(this.elementRef.nativeElement);
    const mainParent = this.renderer.parentNode(elementParent);
    if (!mainParent || !elementParent) {
      return;
    }
    this.renderer.removeChild(mainParent, elementParent);
    this.renderer.removeChild(elementParent, this.elementRef.nativeElement);
    this.renderer.appendChild(mainParent, this.elementRef.nativeElement);
  }
  private insertParent() {
    const currentParent = this.renderer.parentNode(this.elementRef.nativeElement);
    if (!currentParent) {
      return;
    }
    this.parentNode = this.renderer.createElement('div');
    this.renderer.insertBefore(currentParent, this.parentNode, this.elementRef.nativeElement);
    this.renderer.appendChild(this.parentNode, this.elementRef.nativeElement);
    this.renderer.listen(this.parentNode, 'mouseenter', () => {
      if (this.accessDenied) {
        this.tooltip.message = 'Данное действие запрещено в связи с отсутствием необходимых прав';
        this.tooltip.show();
      }
    });
    this.renderer.listen(this.parentNode, 'mouseleave', () => {
      this.tooltip.hide();
    });
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes?.['permissions'].firstChange) {
      return;
    }
    this.checkState();
  }
  ngAfterViewInit() {
    this.checkState();
  }
}
