import { Directive, Injector, Input, Renderer2, TemplateRef, ViewContainerRef } from '@angular/core';
import { EmptyTemplateComponent } from '..';

@Directive({
  selector: '[displayList]',
  standalone: true,
})
export class DisplayListDirective {
  @Input() set displayListOf(list: Array<unknown>) {
    if (!this.parentRef) {
      return;
    }
    this.parentRef.clear();
    if (list.length) {
      this.viewContainer.clear();
      list.forEach((item) => {
        this.viewContainer.createEmbeddedView(this.templateRef, {
          $implicit: item,
          index: list.indexOf(item),
        });
      });
    } else {
      this.viewContainer.clear();
      this.setEmptyState();
    }
  }
  @Input() displayListEmpty: string = 'Список пуст';

  private parentRef: ViewContainerRef | null = null;
  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private renderer: Renderer2,
    private injector: Injector,
  ) {
    this.parentRef = Injector.create({ providers: [], parent: this.injector }).get(ViewContainerRef);
  }

  private setEmptyState() {
    if (!this.parentRef) {
      return;
    }
    const emptyTextEl: HTMLParagraphElement = this.renderer.createElement('p');
    emptyTextEl.textContent = this.displayListEmpty;
    this.parentRef.createComponent(EmptyTemplateComponent, {
      projectableNodes: [[], [emptyTextEl], []],
    });
  }
}
