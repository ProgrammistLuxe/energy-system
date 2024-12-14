import { Directive, HostListener, Input, Query } from '@angular/core';
import { Params, Router } from '@angular/router';

@Directive({
  selector: '[appOpenInNewTab]',
  standalone: true,
})
export class OpenInNewTabDirective {
  @HostListener('click', ['$event']) onClick(event: Event) {
    event.preventDefault();
    this.openInNewTab();
  }
  @Input() path: string[] = [];
  @Input() query: Params = {};
  constructor(private router: Router) {}
  openInNewTab() {
    const url = this.router.serializeUrl(this.router.createUrlTree(this.path, { queryParams: this.query }));
    window.open(url, '_blank');
  }
}
