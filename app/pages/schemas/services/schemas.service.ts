import { Injectable } from '@angular/core';
import { GetGraphDlpSchema } from '@api-calls/services/http-dlp-service/models';
import { HttpGraphService } from '@api-calls/services/http-graph-service/http-graph.service';
import { HttpIconsService } from '@api-calls/services/http-icons-service/http-icons.service';
import { EnergyElementIcon } from '@api-calls/services/http-icons-service/models';
import { DiffService } from '@features/active-diffs-table/services/diff.service';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';
import { NotificationsService } from '@services';
import { BehaviorSubject, Observable, finalize } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SchemasService {
  constructor(
    private httpIconsService: HttpIconsService,
    private httpGraphService: HttpGraphService,
    private notificationsService: NotificationsService,
    private diffService: DiffService,
  ) {}
  iconsLoading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private _selectedSchema$: BehaviorSubject<GetGraphDlpSchema | null> = new BehaviorSubject<GetGraphDlpSchema | null>(
    null,
  );
  get selectedSchema(): GetGraphDlpSchema | null {
    return this._selectedSchema$.value;
  }
  set selectedSchema(value: GetGraphDlpSchema) {
    this._selectedSchema$.next(value);
  }
  get selectedSchema$(): Observable<GetGraphDlpSchema | null> {
    return this._selectedSchema$.asObservable();
  }

  private _iconList$: BehaviorSubject<EnergyElementIcon[]> = new BehaviorSubject<EnergyElementIcon[]>([]);
  get iconList(): EnergyElementIcon[] {
    return this._iconList$.value;
  }
  getIcons() {
    this.iconsLoading$.next(true);
    this.httpIconsService
      .getEnergyElementsIcons()
      .pipe(finalize(() => this.iconsLoading$.next(false)))
      .subscribe((res) => {
        if (res.error) {
          this._iconList$.next([]);
          const message = getErrorsMessage(res.error) || 'Ошибка получения графических примитивов';
          this.notificationsService.displayMessage('Ошибка', message, 'error');
        } else {
          this._iconList$.next(res.result);
        }
      });
  }
  getNodeData(uid: string) {
    return this.httpGraphService.getGraphNodeData(uid);
  }
  saveDiff(diff: string) {
    return this.diffService.saveDiff(diff);
  }
}
