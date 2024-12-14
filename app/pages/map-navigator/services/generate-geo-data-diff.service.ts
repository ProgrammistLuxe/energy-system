import { Injectable } from '@angular/core';
import { uid } from '@core/utils/uid';
import { AppConfigService, NotificationsService } from '@services';
import { LatLng } from 'leaflet';
import { MapService } from './map.service';
import { getErrorsMessage } from '@core/utils/getErrorsMessage';
import { Observable, map, of } from 'rxjs';
export interface GeoAddACLineDataDiff {
  pointsList: GeoPoint[];
  lineSpansList: LineSpan[];
}
export interface GeoPoint {
  uid: string;
  name: string;
  type: string;
  latLang: LatLng;
  isNew: boolean;
  parentACLineSegment?: string | undefined;
}
export interface LineSpan {
  uid: string;
  name: string;
  type: string;
  pointsUidList: string[];
}
export interface DiffData {
  diff: string;
  name: string;
}
@Injectable()
export class GenerateGeoDataDiffService {
  private coordSystemUid: string = 'br:#_3f02b8df-4f79-4abb-84a0-38facf4411d0';
  private acLineParentUid: string = 'br:#_0dc15bad-2586-4efe-b500-75b6431deb6d'; //высоковольтный рэс - линии 110 Брест-1 - Брест-Западная;
  private pointFolderUid: string = 'br:#_61b6d905-7e87-479b-9339-6a997a90c49b'; //рэс-3;
  constructor(
    private appConfigService: AppConfigService,
    private notificationsService: NotificationsService,
    private mapService: MapService,
  ) {}
  deleteElementDiff(element: LineSpan | GeoPoint) {
    const prefix = element.type === 'LineSpan' ? 'its' : 'cim';
    const diff = `
    <rdf:RDF xmlns:its="http://intechs.by#" xmlns:cim="http://iec.ch/TC57/2014/CIM-schema-cim16#"
      xmlns:cim17="http://iec.ch/TC57/2014/CIM-schema-cim17#" xmlns:me="http://monitel.com/2014/schema-cim16#" xmlns:rf="http://gost.ru/2019/schema-cim01#"
      xmlns:rh="http://rushydro.ru/2015/schema-cim16#" xmlns:so="http://so-ups.ru/2015/schema-cim16#" 
      xmlns:dm="http://iec.ch/TC57/61970-552/DifferenceModel/1#" xmlns:md="http://iec.ch/TC57/61970-552/ModelDescription/1#"
      xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
        <dm:DifferenceModel>
          <md:Model.version>ver:11.6.5.203;ext:4;</md:Model.version>
            <dm:forwardDifferences/>
          <dm:reverseDifferences>
            <${prefix}:${element.type} rdf:about="${element.uid}">
              <cim:IdentifiedObject.name>${element.name}</cim:IdentifiedObject.name>
            </${prefix}:${element.type}>
          </dm:reverseDifferences>
        </dm:DifferenceModel>
    </rdf:RDF>`;

    this.mapService.saveDiff({ diff, name: element.name });
  }
  loadRelocatePontDiff(point: GeoPoint) {
    this.getPositionPointByUid(point.uid).subscribe((response) => {
      if (response.error) {
        const errorMessage = 'Ошибка получения координат';
        this.notificationsService.displayMessage('Ошибка', errorMessage, 'error', 3000);
        return;
      }
      if (!response.result.data?.data?.length) {
        return;
      }
      const positionData: Record<string, any> = response.result.data.data[0];
      const name = point.name;
      const diff = `
        <rdf:RDF xmlns:its="http://intechs.by#" xmlns:cim="http://iec.ch/TC57/2014/CIM-schema-cim16#"
          xmlns:cim17="http://iec.ch/TC57/2014/CIM-schema-cim17#" xmlns:me="http://monitel.com/2014/schema-cim16#" xmlns:rf="http://gost.ru/2019/schema-cim01#"
          xmlns:rh="http://rushydro.ru/2015/schema-cim16#" xmlns:so="http://so-ups.ru/2015/schema-cim16#" 
          xmlns:dm="http://iec.ch/TC57/61970-552/DifferenceModel/1#" xmlns:md="http://iec.ch/TC57/61970-552/ModelDescription/1#"
          xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
            <dm:DifferenceModel>
              <md:Model.version>ver:11.6.5.203;ext:4;</md:Model.version>
              <dm:forwardDifferences>
                  <rdf:Description rdf:about="${positionData['position_point']}" me:className="PositionPoint">
                  <cim:PositionPoint.yPosition>${point.latLang.lat}</cim:PositionPoint.yPosition>
                  <cim:PositionPoint.xPosition>${point.latLang.lng}</cim:PositionPoint.xPosition>
                  </rdf:Description>  
              </dm:forwardDifferences>
              <dm:reverseDifferences>
                <rdf:Description rdf:about="${positionData['position_point']}" me:className="PositionPoint">
                  <cim:PositionPoint.yPosition>${positionData['yPosition']}</cim:PositionPoint.yPosition>
                  <cim:PositionPoint.xPosition>${positionData['xPosition']}</cim:PositionPoint.xPosition>
                </rdf:Description>  
              </dm:reverseDifferences>
            </dm:DifferenceModel>
        </rdf:RDF>`;
      this.mapService.saveDiff({ diff, name });
    });
  }
  loadLineSpanDiff(pointsList: GeoPoint[], lineSpan: LineSpan, parentACLine: string | null) {
    if (!parentACLine) {
      return of(null);
    }
    return this.generateACLineDiff(pointsList, [lineSpan], parentACLine).pipe(
      map((data) => {
        if (!data) {
          return null;
        }
        const { id, acLineDiff, reverseAcLineDiff, name } = data;
        const lineSpanDiff = this.generateLineSpanDifferenceList(pointsList, [lineSpan], parentACLine);
        const pointsDiff = this.generatePointsDiff(pointsList, [lineSpan]);
        const diff = [acLineDiff, lineSpanDiff, pointsDiff].join('\n');
        this.mapService.saveDiff({ diff: this.getRdfDifferenceModal(diff, reverseAcLineDiff), name });
        return id;
      }),
    );
  }
  loadPointDiff(geoPoint: GeoPoint) {
    const { name, diff } = this.generatePointDiff(geoPoint);
    this.mapService.saveDiff({ diff: this.getRdfDifferenceModal(diff), name });
  }
  loadACLineDiff(acLine: GeoAddACLineDataDiff): Observable<string | undefined | null> {
    if (!acLine.lineSpansList.length) {
      return of(null);
    }
    return this.generateACLineDiff(acLine.pointsList, acLine.lineSpansList).pipe(
      map((data) => {
        if (!data) {
          return null;
        }
        const { acLineDiff, id, reverseAcLineDiff, name } = data;
        const lineSpanDiff = this.generateLineSpanDifferenceList(acLine.pointsList, acLine.lineSpansList, id);
        const pointsDiff = this.generatePointsDiff(acLine.pointsList, acLine.lineSpansList);
        const diff = [acLineDiff, lineSpanDiff, pointsDiff].join('\n');
        this.mapService.saveDiff({ diff: this.getRdfDifferenceModal(diff, reverseAcLineDiff), name });
        return id;
      }),
    );
  }
  private generateLineSpanDifferenceList(pointsList: GeoPoint[], lineSpanList: LineSpan[], parentUid: string): string {
    const diffTemplate = `
    ${lineSpanList
      .map((lineSpan) => {
        const children = pointsList.filter((point) => lineSpan.pointsUidList.includes(point.uid));
        const diff = `
          <its:${lineSpan.type} rdf:about="${lineSpan.uid}">
            <cim:IdentifiedObject.name>${lineSpan.name}</cim:IdentifiedObject.name>
            ${children.map((child) => `<me:IdentifiedObject.ChildObjects rdf:resource="${child.uid}"/>`).join('\n')}
            <me:IdentifiedObject.ParentObject rdf:resource="${parentUid}"/>
          </its:${lineSpan.type}>`;
        return diff;
      })
      .join('\n')}
  `;
    return diffTemplate;
  }
  private getPositionPointByUid(uid: string) {
    const query = `PREFIX cim: <http://iec.ch/TC57/2014/CIM-schema-cim16#> select ?obj ?position_point ?xPosition ?yPosition  where {?s ?p <${uid}>. ?s ^cim:PositionPoint.Location ?position_point; cim:Location.PowerSystemResources ?obj. ?position_point cim:PositionPoint.xPosition ?xPosition; cim:PositionPoint.yPosition ?yPosition }`;
    return this.mapService.graphSparqlRequest(query);
  }
  private generatePointDiff(point: GeoPoint) {
    const locationId = this.appConfigService.config['GRAPH_CONTEXT'] + '#_' + uid();
    const positionPointId = this.appConfigService.config['GRAPH_CONTEXT'] + '#_' + uid();
    const prefix = point.type === 'grndTower' ? 'its' : 'cim';
    const diff = `
     <me:Folder rdf:about="${this.pointFolderUid}"> 
       <me:IdentifiedObject.ChildObjects rdf:resource="${point.uid}"/>
    </me:Folder>
    <${prefix}:${point.type} rdf:about="${point.uid}">
      <cim:IdentifiedObject.name>${point.name}</cim:IdentifiedObject.name>
      <me:IdentifiedObject.ParentObject rdf:resource="${this.pointFolderUid}"/>
    </${prefix}:${point.type}>
    <cim:Location rdf:about="${locationId}">
      <cim:Location.PowerSystemResources rdf:resource="${point.uid}"/>
      <cim:Location.CoordinateSystem rdf:resource="${this.coordSystemUid}"/>
    </cim:Location>
    <cim:PositionPoint rdf:about="${positionPointId}">
      <cim:PositionPoint.Location rdf:resource="${locationId}"/>
      <cim:PositionPoint.yPosition>${point.latLang.lat}</cim:PositionPoint.yPosition>
      <cim:PositionPoint.xPosition>${point.latLang.lng}</cim:PositionPoint.xPosition>
    </cim:PositionPoint>
    `;
    return { diff, name: point.name };
  }
  // private getRdfDifferenceModal(forwardDifferences: string, reverseDifferences: string) {
  //   return `<rdf:RDF xmlns:cim="http://iec.ch/TC57/2014/CIM-schema-cim16#"
  //             xmlns:cim17="http://iec.ch/TC57/2014/CIM-schema-cim17#" xmlns:me="http://monitel.com/2014/schema-cim16#" xmlns:rf="http://gost.ru/2019/schema-cim01#"
  //             xmlns:rh="http://rushydro.ru/2015/schema-cim16#" xmlns:so="http://so-ups.ru/2015/schema-cim16#"
  //             xmlns:dm="http://iec.ch/TC57/61970-552/DifferenceModel/1#" xmlns:md="http://iec.ch/TC57/61970-552/ModelDescription/1#"
  //             xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  //               <dm:DifferenceModel>
  //                   <md:Model.version>ver:11.6.5.203;ext:4;</md:Model.version>
  //                   <dm:forwardDifferences>
  //                      ${forwardDifferences}
  //                   </dm:forwardDifferences>
  //                   <dm:reverseDifferences>
  //                      ${reverseDifferences}
  //                   </dm:reverseDifferences>
  //               </dm:DifferenceModel>
  //           </rdf:RDF>`;
  // }
  private getRdfDifferenceModal(forwardDifferences: string, reverseDifferences: string = '') {
    return `<rdf:RDF xmlns:its="http://intechs.by#" xmlns:cim="http://iec.ch/TC57/2014/CIM-schema-cim16#"
              xmlns:cim17="http://iec.ch/TC57/2014/CIM-schema-cim17#" xmlns:me="http://monitel.com/2014/schema-cim16#" xmlns:rf="http://gost.ru/2019/schema-cim01#"
              xmlns:rh="http://rushydro.ru/2015/schema-cim16#" xmlns:so="http://so-ups.ru/2015/schema-cim16#" 
              xmlns:dm="http://iec.ch/TC57/61970-552/DifferenceModel/1#" xmlns:md="http://iec.ch/TC57/61970-552/ModelDescription/1#"
              xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
                <dm:DifferenceModel>
                    <md:Model.version>ver:11.6.5.203;ext:4;</md:Model.version>
                    <dm:forwardDifferences>
                       ${forwardDifferences}
                    </dm:forwardDifferences>
                    ${
                      reverseDifferences
                        ? `
                      <dm:reverseDifferences>
                        ${reverseDifferences}
                      </dm:reverseDifferences>
                      `
                        : `
                         <dm:reverseDifferences/>
                        `
                    }
                  
                </dm:DifferenceModel>
            </rdf:RDF>`;
  }
  private generateACLineDiff(pointsList: GeoPoint[], lineSpansList: LineSpan[], acLineUid: string = '') {
    if (acLineUid) {
      return this.mapService.getNodeData(acLineUid).pipe(
        map((res) => {
          if (res.error) {
            const errorMessage = getErrorsMessage(res.error) || 'Ошибка получения дынных по сегменту';
            this.notificationsService.displayMessage('Ошибка', errorMessage, 'error', 3000);
            return null;
          }
          const properties = res.result.data.properties;
          const nameKey = Object.keys(properties).find((key) => key.includes('IdentifiedObject.name'));
          if (!nameKey) {
            return null;
          }
          let currentAcLineName = properties[nameKey][0]?.['value'];
          let newACLineName = '';
          let reverseDiff = '';
          if (currentAcLineName) {
            reverseDiff = `
            <cim:ACLineSegment rdf:about="${acLineUid}">
              <cim:IdentifiedObject.name>${currentAcLineName}</cim:IdentifiedObject.name>
            </cim:ACLineSegment>
          `;
            currentAcLineName = currentAcLineName.split(' - ');
            currentAcLineName.splice(1, 1);
            currentAcLineName.push(pointsList[pointsList.length - 1].name);
            newACLineName = currentAcLineName.join(' - ');
          } else {
            newACLineName = pointsList[0].name + ' - ' + pointsList[pointsList.length - 1].name;
          }
          const diff = `
          <cim:ACLineSegment rdf:about="${acLineUid}">
            <cim:IdentifiedObject.name>${newACLineName}</cim:IdentifiedObject.name>
            ${lineSpansList
              .map((child) => `<me:IdentifiedObject.ChildObjects rdf:resource="${child.uid}"/>`)
              .join('\n')}     
          </cim:ACLineSegment>
        `;

          return { id: acLineUid, acLineDiff: diff, reverseAcLineDiff: reverseDiff, name: newACLineName };
        }),
      );
    }
    const name = pointsList[0].name + ' - ' + pointsList[pointsList.length - 1].name;
    const id = this.appConfigService.config['GRAPH_CONTEXT'] + '#_' + uid();
    const diffTemplate = ` 
    <cim:Line rdf:about="${this.acLineParentUid}"> 
       <me:IdentifiedObject.ChildObjects rdf:resource="${id}"/>
    </cim:Line>
    <cim:ACLineSegment rdf:about="${id}">
       <cim:IdentifiedObject.name>${name}</cim:IdentifiedObject.name>
       <me:IdentifiedObject.ParentObject rdf:resource="${this.acLineParentUid}"/>
       ${lineSpansList
         .map((child) => `<me:IdentifiedObject.ChildObjects rdf:resource="${child.uid}"/>`)
         .join('\n')}     
    </cim:ACLineSegment>
    `;
    return of({ id, acLineDiff: diffTemplate, reverseAcLineDiff: '', name });
  }
  private generatePointsDiff(pointsList: GeoPoint[], lineSpansList: LineSpan[]): string {
    const pointsDiffList: string[] = pointsList.map((point) => {
      const prefix = point.type === 'grndTower' ? 'its' : 'cim';
      if (!point.isNew) {
        const parenList = lineSpansList.filter((el) => el.pointsUidList.includes(point.uid));
        const diff = `
        <${prefix}:${point.type} rdf:about="${point.uid}">
          ${parenList.map((parent) => `<me:IdentifiedObject.ParentObject rdf:resource="${parent.uid}"/>`).join('\n')}
        </${prefix}:${point.type}>
        `;
        return diff;
      }
      const parenList = lineSpansList.filter((el) => el.pointsUidList.includes(point.uid));
      const locationId = this.appConfigService.config['GRAPH_CONTEXT'] + '#_' + uid();
      const positionPointId = this.appConfigService.config['GRAPH_CONTEXT'] + '#_' + uid();
      const diff = `
      <${prefix}:${point.type} rdf:about="${point.uid}">
        <cim:IdentifiedObject.name>${point.name}</cim:IdentifiedObject.name>
        ${parenList.map((parent) => `<me:IdentifiedObject.ParentObject rdf:resource="${parent.uid}"/>`).join('\n')}
      </${prefix}:${point.type}>
      <cim:Location rdf:about="${locationId}">
        <cim:Location.PowerSystemResources rdf:resource="${point.uid}"/>
        <cim:Location.CoordinateSystem rdf:resource="${this.coordSystemUid}"/>
      </cim:Location>
      <cim:PositionPoint rdf:about="${positionPointId}">
        <cim:PositionPoint.Location rdf:resource="${locationId}"/>
        <cim:PositionPoint.yPosition>${point.latLang.lat}</cim:PositionPoint.yPosition>
        <cim:PositionPoint.xPosition>${point.latLang.lng}</cim:PositionPoint.xPosition>
      </cim:PositionPoint>
      `;
      return diff;
    });
    return pointsDiffList.join('\n');
  }
}
