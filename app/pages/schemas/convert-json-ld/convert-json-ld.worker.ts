/// <reference lib="webworker" />

addEventListener('message', ({ data }) => {
  if (data.length && data[0]?.['@type']) {
    context = data[0]?.['@type'][0]?.split('#')[0] ?? 'http://iec.ch/TC57/2014/schema-cim16';
  }
  const response = convertJsonLd(data);
  postMessage(response);
});

let context: string = 'http://iec.ch/TC57/2014/schema-cim16';

const singleVariables: string[] = [
  'GroundDisconnector',
  'PowerTransformer',
  'Disconnector',
  'Fuse',
  'PotentialTransformer',
  'SurgeArrester',
  'Breaker',
  'Bay',
  'TransformerEnd',
  'Substation',
  'CurrentTransformer',
  'PotentialTransformer',
  'BusbarSection',
  'Line',
  'Terminal',
  'DiagramObjectPoint',
  'DiagramObject',
  'TextDiagramObject',
];
const keys: string[] = [
  'IdentifiedObject.name',
  'text',
  'SubGeographicalRegion',
  'ImgType',
  'yPosition',
  'xPosition',
  'offsetX',
  'offsetY',
  'rotation',
  'sequenceNumber',
  'drawingOrder',
  'DiagramObjectGluePoint',
];
let currentJsonLd: Record<string, any>[] = [];
function convertJsonLd(jsonLd: Record<string, any>[]) {
  const elements: Record<string, any>[] = [];
  currentJsonLd = jsonLd;
  jsonLd.forEach((element) => {
    let el: Record<string, any> = {};
    Object.keys(element).forEach((key) => {
      if (!key) {
        return;
      }
      if (key === '@type') {
        el = calculateDiagramObjectPointValues(element, el);
        return;
      }
    });
    if (Object.keys(el).length) {
      elements.push(el);
    }
  });
  return elements;
}
function validTypeCheck(element: Record<string, any>) {
  const validType = singleVariables.some((variable) => {
    const type = element?.['@type'] ?? null;
    return type && type[0].includes(variable);
  });
  return validType;
}
function calculateDiagramObjectPointValues(element: Record<string, any>, el: any) {
  if (!element?.['@type']?.length) {
    return structuredClone(el);
  }
  if (element['@type'][0].includes('DiagramObjectPoint')) {
    if (
      !element[context + '#' + 'DiagramObjectPoint.DiagramObject'] ||
      !element[context + '#' + 'DiagramObjectPoint.DiagramObject']?.length
    ) {
      return structuredClone(el);
    }
    const diagramObject = currentJsonLd.find(
      (item) => item['@id'] === element[context + '#' + 'DiagramObjectPoint.DiagramObject'][0]['@id'],
    );
    if (!diagramObject) {
      return structuredClone(el);
    }
    if (diagramObject['@type'][0].includes('TextDiagramObject')) {
      Object.keys(diagramObject).forEach((key) => {
        el = addAvailableKeysValue(diagramObject, key, el);
      });
      const el_id = element['@id'];
      el = addId(el_id, el);
      if (diagramObject[context + '#' + 'TextDiagramObject.IdentifiedObject']) {
        el['diagramObjectId'] = diagramObject[context + '#' + 'TextDiagramObject.IdentifiedObject'][0]['@id'];
      }
      el = {
        ...getData(element),
        ...el,
      };
      el['type'] = 'TextDiagramObject';
      return structuredClone(el);
    }
    if (
      diagramObject[context + '#' + 'DiagramObject.Diagram'] &&
      !diagramObject[context + '#' + 'DiagramObject.IdentifiedObject']
    ) {
      el['diagramObjectId'] = diagramObject['@id'];
      const el_id = element['@id'];
      el = addId(el_id, el);
      el = {
        ...getData(element),
        ...getData(diagramObject),
        ...el,
      };

      el['type'] = 'Terminal';

      return structuredClone(el);
    }
    if (!diagramObject[context + '#' + 'DiagramObject.IdentifiedObject']) {
      return structuredClone(el);
    }

    el['diagramObjectId'] = diagramObject[context + '#' + 'DiagramObject.IdentifiedObject'][0]['@id'];
    const el_id = element['@id'];
    el = addId(el_id, el);
    el = {
      ...getData(element),
      ...getData(diagramObject),
      ...el,
    };
    return structuredClone(el);
  }
  return structuredClone(el);
}
function addAvailableKeysValue(element: Record<string, any>, currentKey: string, el: any) {
  if (!validTypeCheck(element)) {
    return structuredClone(el);
  }
  keys.forEach((key) => {
    if (currentKey.includes(key)) {
      if (!element[currentKey as keyof typeof element]) {
        return;
      }
      const keyValue = ['DiagramObjectGluePoint'].includes(key)
        ? element[currentKey as keyof typeof element][0]['@id']
        : element[currentKey as keyof typeof element][0]['@value'];
      if (keyValue === 'TerminalCommon') {
        el = {
          ...el,
          type: 'Terminal',
        };
      } else {
        el = {
          ...el,
          [key]: keyValue ?? '',
        };
      }
    }
  });
  return structuredClone(el);
}
function getArrayOfElements(elements: Array<any>) {
  const data: Array<any> = [];
  elements.forEach((el) => {
    data.push(getData(el));
  });
  return data;
}
function getData(element: any): Record<string, any> {
  let el: Record<string, any> = {};
  Object.keys(element).forEach((key) => {
    if (!key) {
      return;
    }
    if (key === '@id') {
      el = addId(element[key], el);
    }
    if (key === '@type') {
      singleVariables.forEach((variable) => {
        const type = element[key] ?? null;
        if (!type || !type[0].includes(variable)) {
          return;
        }
        el = {
          ...el,
          type: variable,
        };
      });
      return;
    }

    el = addAvailableKeysValue(element, key, el);
  });
  return el;
}
function addId(el_id: string, el: any) {
  el = {
    ...el,
    id: el_id,
  };
  return structuredClone(el);
}
