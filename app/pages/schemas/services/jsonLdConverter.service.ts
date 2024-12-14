import { Injectable } from '@angular/core';
@Injectable()
export class JsonLdConverterService {
  private context: string = 'http://iec.ch/TC57/2014/schema-cim16';
  private currentJsonLd: Record<string, any>[] = [];
  convertToJsonLd(data: Record<string, any>) {
    const jsonLdArray: Record<string, any>[] = [
      { '@id': 'http://iec.ch/TC57/2014/CIM-schema-cim16#Substation' },
      { '@id': 'http://iec.ch/TC57/2014/CIM-schema-cim16#VoltageLevel' },
      { '@id': 'http://iec.ch/TC57/61970-552/ModelDescription/1#FullModel' },
      { '@id': 'http://njh.me/#_21a068d6-da8e-4259-adaa-e4412c1823ed' },
      { '@id': 'http://njh.me/#_341e6b51-9be8-40ae-b0ac-fbcdf563a213' },
      { '@id': 'http://njh.me/#_8f49701c-a8cf-4dd3-9284-32bf5d4a8f5d' },
      { '@id': 'http://njh.me/#_bbb59fdf-b4e3-4485-816d-4566147b176f' },
      { '@id': 'http://iec.ch/TC57/2014/CIM-schema-cim16#DiagramObject' },
      { '@id': 'http://iec.ch/TC57/2014/CIM-schema-cim16#DiagramObjectGluePoint' },
      { '@id': 'http://iec.ch/TC57/2014/CIM-schema-cim16#DiagramObjectPoint' },
      { '@id': 'http://iec.ch/TC57/2014/CIM-schema-cim16#Disconnector' },
      { '@id': 'http://iec.ch/TC57/2014/CIM-schema-cim16#Terminal' },
      {
        '@id': 'http://njh.me/#_f239ff83-9367-4c33-8932-0d8a9fdb4a2c',
        '@type': ['http://iec.ch/TC57/61970-552/ModelDescription/1#FullModel'],
        'http://iec.ch/TC57/61970-552/ModelDescription/1#Model.created': [{ '@value': '2024-01-22T12:29:42.2212023Z' }],
        'http://iec.ch/TC57/61970-552/ModelDescription/1#Model.version': [{ '@value': 'ver:11.6.5.204;ext:5;' }],
        'http://monitel.com/2014/schema-cim16#Model.name': [{ '@value': 'CIM16' }],
      },
    ];
    const classIdVariables: number[] = [];
    data['cells'].map((element: any) => {
      if (element['type'] === 'standard.Link') {
        return;
      }
      if (!element['attrs']?.['rdf']?.['new']) {
        let diagramObjectPoint: Record<string, any> = {};
        const diagramObjectPointStart =
          this.currentJsonLd.find((elem) => elem['@id'] === element['attrs']?.['rdf']?.['id']) ?? {};
        diagramObjectPoint = this.addDiagramObjectPointFields(diagramObjectPointStart, diagramObjectPoint, element);
        jsonLdArray.push(diagramObjectPoint);
        return;
      }
      let diagramObject: Record<string, any> = {};
      let diagramObjectPoint: Record<string, any> = {};
      let identifiedObject: Record<string, any> = {};

      diagramObject['@type'] = [this.context + '#' + 'DiagramObject'];
      diagramObject[this.context + '#' + 'DiagramObject' + '.' + 'IdentifiedObject'] =
        this.context + '#' + element['attrs']?.['rdf']?.['classId'] + 'O';
      diagramObject['@id'] = this.context + '#' + element['attrs']?.['rdf']?.['classId'] + 'DO';

      identifiedObject['@id'] = this.context + '#' + element['attrs']?.['rdf']?.['classId'] + 'O';
      identifiedObject['@type'] = [this.context + '#' + element['attrs']?.['rdf']?.['type']];
      if (element?.['attrs']?.['label']?.['text'] ?? null !== null) {
        identifiedObject[this.context + '#' + 'IdentifiedObject.name'] = [
          { '@value': element?.['attrs']?.['label']?.['text'] },
        ];
      }
      // if (element['embeds']?.length) {
      //   element['embeds']?.forEach((child: any) => {
      //     const child_el = data['cells'].find((el: any) => el['id'] === child);
      //     if (!child_el) {
      //       return;
      //     }
      //     if (!el[context + el['@type'] + child_el + 's']) {
      //       el[el['@type'][0] + '.' + child_el['attrs']['rdf']['type'] + 's'] = [];
      //     }
      //     el[el['@type'][0] + '.' + child_el['attrs']['rdf']['type'] + 's'].push({
      //       '@id': child_el['attrs']['rdf']['id'],
      //     });
      //   });
      // }
      const diagramObjectPointStart =
        this.currentJsonLd.find((elem) => elem['@id'] === diagramObjectPoint['@id']) ?? {};
      const diagramObjectStart = this.currentJsonLd.find((elem) => elem['@id'] === diagramObject['@id']) ?? {};
      const identifiedObjectStart = this.currentJsonLd.find((elem) => elem['@id'] === identifiedObject['@id']) ?? {};
      diagramObjectPoint = this.addDiagramObjectPointFields(diagramObjectPointStart, diagramObjectPoint, element);
      diagramObject = {
        ...diagramObjectStart,
        ...diagramObject,
      };
      identifiedObject = {
        ...identifiedObjectStart,
        ...identifiedObject,
      };

      if (!classIdVariables.includes(element['attrs']?.['rdf']?.['classId'])) {
        jsonLdArray.push(diagramObject);
        jsonLdArray.push(identifiedObject);
        classIdVariables.push(element['attrs']?.['rdf']?.['classId']);
      }
      jsonLdArray.push(diagramObjectPoint);
    });
  }
  private addDiagramObjectPointFields(
    diagramObjectPointStart: Record<string, any>,
    diagramObjectPoint: Record<string, any>,
    element: Record<string, any>,
  ) {
    if (element['attrs']?.['rdf']?.['new']) {
      diagramObjectPoint['@type'] = [this.context + '#' + 'DiagramObjectPoint'];
      diagramObjectPoint[this.context + '#' + 'DiagramObjectPoint' + '.' + 'DiagramObject'] =
        this.context + '#' + element['attrs']?.['rdf']?.['id'] + 'DO';
      diagramObjectPoint['@id'] = this.context + '#' + element['attrs']?.['rdf']?.['classId'] + 'DOP';
    }

    if (element?.['position']?.['x'] ?? null !== null) {
      diagramObjectPoint[this.context + '#' + 'DiagramObjectPoint' + '.' + 'xPosition'] = [
        { '@value': element?.['position']?.['x'] },
      ];
    }
    if (element?.['position']?.['y'] ?? null !== null) {
      diagramObjectPoint[this.context + '#' + 'DiagramObjectPoint' + '.' + 'yPosition'] = [
        { '@value': element?.['position']?.['y'] },
      ];
    }
    if (element?.['attrs']?.['rdf']?.['offsetX'] ?? null !== null) {
      diagramObjectPoint[this.context + '#' + 'DiagramObjectPoint' + '.' + 'offsetX'] = [
        { '@value': element?.['attrs']?.['rdf']?.['offsetX'] },
      ];
    }
    if (element?.['attrs']?.['rdf']?.['offsetY'] ?? null !== null) {
      diagramObjectPoint[this.context + '#' + 'DiagramObjectPoint' + '.' + 'offsetY'] = [
        { '@value': element?.['attrs']?.['rdf']?.['offsetY'] },
      ];
    }
    if (element?.['attrs']?.['rdf']?.['sequenceNumber'] ?? null !== null) {
      diagramObjectPoint[this.context + '#' + 'DiagramObjectPoint' + '.' + 'sequenceNumber'] = [
        { '@value': element?.['attrs']?.['rdf']?.['sequenceNumber'] },
      ];
    }
    if (element?.['attrs']?.['rdf']?.['text'] ?? null !== null) {
      diagramObjectPoint[this.context + '#' + 'DiagramObjectPoint' + '.' + 'text'] = [
        { '@value': element?.['attrs']?.['rdf']?.['text'] },
      ];
    }
    diagramObjectPoint = {
      ...diagramObjectPointStart,
      ...diagramObjectPoint,
    };
    return structuredClone(diagramObjectPoint);
  }
}
