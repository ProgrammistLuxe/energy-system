import { Injectable } from '@angular/core';
import { HttpGraphService } from '@api-calls/services/http-graph-service/http-graph.service';
import { PanelState } from '../containers/map/models';
import { GetPassportFilesReq, GetPassportReq } from '@api-calls/services/http-graph-service/models';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpGeographyService, HttpMinioService } from '@api-calls/services';
import { DiffItem, DiffService } from '@features/active-diffs-table/services/diff.service';
import { NotificationsService } from '@services';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';
import { DiffData } from './generate-geo-data-diff.service';

interface PanelStateData {
  name: string;
  type: string;
}
@Injectable()
export class MapService {
  constructor(
    private httpGraphService: HttpGraphService,
    private httpGetGraphGeography: HttpGeographyService,
    private notificationsService: NotificationsService,
    private httpMinioService: HttpMinioService,
    private diffService: DiffService,
  ) {}
  private _sidePanelStateData$: BehaviorSubject<PanelStateData | null> = new BehaviorSubject<PanelStateData | null>(
    null,
  );
  private _sidePanelState$: BehaviorSubject<PanelState | null> = new BehaviorSubject<PanelState | null>(null);
  set panelState(state: PanelState | null) {
    this._sidePanelState$.next(state);
  }
  get panelState(): PanelState {
    return this._sidePanelState$.value;
  }
  get panelState$(): Observable<PanelState | null> {
    return this._sidePanelState$.asObservable();
  }

  get panelStateData(): PanelStateData | null {
    return this._sidePanelStateData$.value;
  }
  set panelStateData(data: PanelStateData | null) {
    this._sidePanelStateData$.next(data);
  }

  graphSparqlRequest(query: string) {
    return this.httpGraphService.postGraphSparqlV3(query);
  }
  getGeoJsonV2(class_list: string) {
    return this.httpGetGraphGeography.getGraphGeographyV2V3(class_list);
  }
  getGeoJson() {
    return this.httpGetGraphGeography.getGraphGeographyV3();
  }
  getPng(uid: string) {
    return this.httpGraphService.getGraphGetPngV3(uid);
  }
  getPngList(uid: string) {
    return this.httpGraphService.getGraphGetPngUidV3(uid);
  }
  getPassport(data: GetPassportReq) {
    return this.httpGraphService.getGraphPassport(data);
  }
  getNodeData(uid: string) {
    return this.httpGraphService.getGraphNodeData(uid);
  }
  getCoordsByUid(uid: string) {
    return this.httpGetGraphGeography.getCoordsByUid(uid);
  }
  getCoordsByName(name: string) {
    return this.httpGetGraphGeography.getCoordsByName(name);
  }
  downloadPassport(data: GetPassportFilesReq) {
    return this.httpGraphService.getGraphPassportFiles(data);
  }

  async saveDiff(diffData: DiffData) {
    const res = await this.diffService.saveDiff(diffData.diff);
    res.subscribe((response) => {
      if (!response) {
        this.notificationsService.displayMessage('Ошибка', 'Ошибка сохранения', 'error');
        return;
      }
      if (response.error) {
        const errorMessage = getErrorsMessage(response.error) || 'Ошибка сохранения';
        this.notificationsService.displayMessage('Ошибка', errorMessage, 'error');
        return;
      }
      this.notificationsService.displayMessage('Успешно', 'Успешно сохранено', 'success', 3000);
      if (!response.result.data.length) {
        return;
      }
      const computedDiff: DiffItem = {
        diff_id: response.result.data[0].id,
        diff_name: response.result.data[0].object_name,
        place_name: diffData.name,
      };
      this.diffService.insertIntoDiffList(computedDiff);
    });
  }
}
