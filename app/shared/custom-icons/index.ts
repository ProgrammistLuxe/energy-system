import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { CommonIcons } from './common-icons';

@NgModule({
  imports: [CommonModule],
})
export class CustomIconsModule {
  constructor(
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
  ) {
    new CommonIcons(this.matIconRegistry, this.domSanitizer);
  }
}
