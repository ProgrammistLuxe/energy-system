import { Injectable } from '@angular/core';

export type ChangeEventType = 'add' | 'remove' | 'properties' | 'position' | 'groupPosition' | 'removeAll';

export interface ChangeEvent {
  type: ChangeEventType;
  event: any;
}

@Injectable()
export class ChangeQueueService {
  private _queue: ChangeEvent[] = [];
  private updating = false;

  init() {
    this._queue = [];
    this.updating = false;
  }

  pushEvent(event: ChangeEvent) {
    if (this.updating) {
      return;
    }
    this._queue.push(event);
  }

  undoEvent() {
    if (!this._queue.length) {
      return;
    }
    const event = this._queue.pop();
    switch (event?.type) {
      case 'add':
        {
          this.updating = true;
          event.event.change.graph.removeCells([event.event.event]);
          this.updating = false;
        }
        break;
      case 'remove':
        {
          this.updating = true;
          event.event.change.graph.addCells([event.event.event]);
          this.updating = false;
        }
        break;
      case 'position':
        {
          event.event.event.prop('position', event.event.initial.position);
        }
        break;
      case 'groupPosition':
        {
          const rectangle = event.event.find((el: any) => el.element.attributes.type === 'standard.Rectangle');
          const filtredElements = event.event.filter((el: any) => el.element.attributes.type !== 'standard.Rectangle');
          for (const element of filtredElements) {
            element.element.prop('position', element.initial.position);
          }
          if (rectangle?.element?.prop('embeds')?.length) {
            rectangle.element.prop('size', rectangle.initial.size);
            rectangle.element.fitEmbeds({ deep: true, padding: 10 });
          }
        }
        break;
      case 'properties':
        {
          event.event.event.view.model.prop('position', event.event.initial.position);
          event.event.event.view.model.prop('attrs', event.event.initial.attrs);
          event.event.event.view.model.prop('fields', event.event.initial.fields, { rewrite: true });
          event.event.event.view.model.prop('size', event.event.initial.size);
          event.event.event.view.model.prop('angle', event.event.initial.angle);
        }
        break;
      case 'removeAll':
        {
          this.updating = true;
          event.event.graph.fromJSON({ cells: event.event.graphCopy.cells });
          this.updating = false;
        }
        break;
      default: {
      }
    }
  }
}
