/// <reference lib="webworker" />

addEventListener('message', ({ data }) => {
  const parsed_data = JSON.parse(data);
  if (parsed_data.length && parsed_data[0]?.['@type']) {
    selected_contextV1 = parsed_data[0]?.['@type'][0]?.split('#')[0] ?? 'http://iec.ch/TC57/2014/schema-cim16';
  }
  const response = convertDataJsonLdV1(parsed_data);
  postMessage(response);
});
let selected_contextV1: string = 'http://iec.ch/TC57/2014/schema-cim16';

const variableListV1: string[] = [
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
const availableKeyListV1: string[] = [
  'IdentifiedObject.name',
  'text',
  'SubGeographicalRegion',
  'ImgType',
  'yPosition',
  'xPosition',
  'offsetX',
  'offsetY',
  'sequenceNumber',
  'rotation',
  'drawingOrder',
  'DiagramObjectGluePoint',
];
let selectedJsonldV1: Record<string, any>[] = [];
function convertDataJsonLdV1(jsonLd: Record<string, any>[]) {
  const elements: Record<string, any>[] = [];
  selectedJsonldV1 = jsonLd;
  jsonLd.forEach((element) => {
    let el: Record<string, any> = {};
    Object.keys(element).forEach((key) => {
      if (!key) {
        return;
      }
      if (key === '@type') {
        el = calculateDiagramPointValuesV1(element, el);
        return;
      }
    });
    if (Object.keys(el).length) {
      elements.push(el);
    }
  });
  return elements;
}
function validTypesCheckV1(element: Record<string, any>) {
  const validType = variableListV1.some((variable) => {
    const type = element?.['@type'] ?? null;
    return type && type[0].includes(variable);
  });
  return validType;
}
function calculateDiagramPointValuesV1(element: Record<string, any>, el: any) {
  if (!element?.['@type']?.length) {
    return structuredClone(el);
  }
  if (element['@type'][0].includes('DiagramObjectPoint')) {
    if (
      !element[selected_contextV1 + '#' + 'DiagramObjectPoint.DiagramObject'] ||
      !element[selected_contextV1 + '#' + 'DiagramObjectPoint.DiagramObject']?.length
    ) {
      return structuredClone(el);
    }

    const diagramObject = selectedJsonldV1.find(
      (item) => item['@id'] === element[selected_contextV1 + '#' + 'DiagramObjectPoint.DiagramObject'][0]['@id'],
    );
    if (!diagramObject) {
      return structuredClone(el);
    }

    if (diagramObject['@type'][0].includes('TextDiagramObject')) {
      el['diagramObjectId'] = diagramObject['@id'];
      el['parentObjectId'] = diagramObject[selected_contextV1 + '#' + 'TextDiagramObject.IdentifiedObject'][0]['@id'];
      Object.keys(diagramObject).forEach((key) => {
        el = addAvailableObjectKeysValueV1(diagramObject, key, el);
      });
      el = {
        ...getObjectDataV1(element),
        ...el,
      };
      el['type'] = 'TextDiagramObject';
      const isPanelKey = Object.keys(diagramObject).find((key) => key.includes('isControlPanel'));
      if (isPanelKey && diagramObject[isPanelKey].length && diagramObject[isPanelKey][0]?.['@value'] === 'true') {
        el['isPanel'] = true;
        const refreshTimeKey = Object.keys(diagramObject).find((key) => key.includes('TimeRefresh'));
        if (!refreshTimeKey) {
          return;
        }
        el['refreshTime'] = Number(diagramObject[refreshTimeKey][0]?.['@value']);
      }
      return structuredClone(el);
    }
    if (
      diagramObject[selected_contextV1 + '#' + 'DiagramObject.Diagram'] &&
      !diagramObject[selected_contextV1 + '#' + 'DiagramObject.IdentifiedObject']
    ) {
      el['diagramObjectId'] = diagramObject['@id'];
      const el_id = element['@id'];
      el = addObjectIdV1(el_id, el);
      el = {
        ...getObjectDataV1(element),
        ...getObjectDataV1(diagramObject),
        ...el,
      };

      el['type'] = 'Terminal';

      return structuredClone(el);
    }

    el['diagramObjectId'] = diagramObject['@id'];
    el['parentObjectId'] = diagramObject[selected_contextV1 + '#' + 'DiagramObject.IdentifiedObject'][0]['@id'];
    const el_id = element['@id'];
    el = addObjectIdV1(el_id, el);
    el = {
      ...getObjectDataV1(element),
      ...getObjectDataV1(diagramObject),
      ...el,
    };
    return structuredClone(el);
  }
  return structuredClone(el);
}
function addAvailableObjectKeysValueV1(element: Record<string, any>, currentKey: string, el: any) {
  if (!validTypesCheckV1(element)) {
    return structuredClone(el);
  }
  availableKeyListV1.forEach((key) => {
    if (!currentKey.includes(key)) {
      return;
    }
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
  });
  return structuredClone(el);
}

function getObjectDataV1(element: any): Record<string, any> {
  let el: Record<string, any> = {};
  Object.keys(element).forEach((key) => {
    if (!key) {
      return;
    }
    if (key === '@id') {
      el = addObjectIdV1(element[key], el);
    }
    if (key === '@type') {
      variableListV1.forEach((variable) => {
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

    el = addAvailableObjectKeysValueV1(element, key, el);
  });
  return el;
}
function addObjectIdV1(el_id: string, el: any) {
  el = {
    ...el,
    id: el_id,
  };
  return structuredClone(el);
}
