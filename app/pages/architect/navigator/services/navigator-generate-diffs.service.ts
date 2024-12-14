import { Injectable } from '@angular/core';
export interface PassportTemplateDifference {
  [key: string]: {
    currentValue: any;
    oldValue: any;
    predicate: string;
    isReference: boolean;
  };
}

@Injectable()
export class NavigatorGenerateDiffsService {
  generateDeleteEntityDiff(uid: string, class_name: string) {
    return `<rdf:RDF xmlns:cim="http://iec.ch/TC57/2014/CIM-schema-cim16#" xmlns:its="http://intechs.by#"
    xmlns:cim17="http://iec.ch/TC57/2014/CIM-schema-cim17#" xmlns:me="http://monitel.com/2014/schema-cim16#" xmlns:rf="http://gost.ru/2019/schema-cim01#"
    xmlns:rh="http://rushydro.ru/2015/schema-cim16#" xmlns:so="http://so-ups.ru/2015/schema-cim16#" 
    xmlns:dm="http://iec.ch/TC57/61970-552/DifferenceModel/1#" xmlns:md="http://iec.ch/TC57/61970-552/ModelDescription/1#"
    xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
      <dm:DifferenceModel>
          <md:Model.version>ver:11.6.5.203;ext:4;</md:Model.version>
          <dm:forwardDifferences/>
        
          <dm:reverseDifferences>
            <${class_name} rdf:about="${uid}">
            
            </${class_name}>
          </dm:reverseDifferences>
     
      </dm:DifferenceModel>
  </rdf:RDF>`;
  }
  generateDiff(
    difference: PassportTemplateDifference,
    uid: string,
    class_name: string,
    type: 'edit' | 'create',
  ): string {
    const forwardDifferenceList: string[] = [];
    const reverseDifferenceList: string[] = [];
    Object.keys(difference).forEach((key) => {
      const predicate = difference[key].predicate;
      if (!Array.isArray(difference[key].currentValue) && !difference[key].isReference) {
        const forwardDiffItem = `<${predicate}>${difference[key].currentValue}</${predicate}>`;
        const reversDiffItem = `<${predicate}>${difference[key].oldValue}</${predicate}>`;
        forwardDifferenceList.push(forwardDiffItem);
        reverseDifferenceList.push(reversDiffItem);
        return;
      }
      if (!Array.isArray(difference[key].currentValue) && difference[key].isReference) {
        const forwardDiffItem = `<${predicate} rdf:resource="${difference[key].currentValue}"/>`;
        forwardDifferenceList.push(forwardDiffItem);
        const reversDiffItem = `<${predicate} rdf:resource="${difference[key].oldValue}"/>`;
        reverseDifferenceList.push(reversDiffItem);
        return;
      }
      difference[key].currentValue.forEach((value: string) => {
        const forwardDiffItem = `<${predicate} rdf:resource="${value}"/>`;
        forwardDifferenceList.push(forwardDiffItem);
      });
      difference[key].oldValue.forEach((value: string) => {
        const reversDiffItem = `<${predicate} rdf:resource="${value}"/>`;
        reverseDifferenceList.push(reversDiffItem);
      });
    });
    const forwardDifferences: string = this.getRdfDescriptionData(forwardDifferenceList, uid, class_name);
    const reverseDifferences: string = this.getRdfDescriptionData(reverseDifferenceList, uid, class_name);
    if (type === 'edit') {
      return this.getRdfDifferenceModal(forwardDifferences, reverseDifferences);
    } else {
      return this.generateCreateDifferenceModal(forwardDifferences);
    }
  }
  private generateCreateDifferenceModal(forwardDifferences: string) {
    return `<rdf:RDF xmlns:cim="http://iec.ch/TC57/2014/CIM-schema-cim16#" xmlns:its="http://intechs.by#"
              xmlns:cim17="http://iec.ch/TC57/2014/CIM-schema-cim17#" xmlns:me="http://monitel.com/2014/schema-cim16#" xmlns:rf="http://gost.ru/2019/schema-cim01#"
              xmlns:rh="http://rushydro.ru/2015/schema-cim16#" xmlns:so="http://so-ups.ru/2015/schema-cim16#" 
              xmlns:dm="http://iec.ch/TC57/61970-552/DifferenceModel/1#" xmlns:md="http://iec.ch/TC57/61970-552/ModelDescription/1#"
              xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
                <dm:DifferenceModel>
                    <md:Model.version>ver:11.6.5.203;ext:4;</md:Model.version>
                    <dm:forwardDifferences>
                       ${forwardDifferences}
                    </dm:forwardDifferences>
                    <dm:reverseDifferences/>
                </dm:DifferenceModel>
            </rdf:RDF>`;
  }
  private getRdfDifferenceModal(forwardDifferences: string, reverseDifferences: string) {
    return `<rdf:RDF xmlns:cim="http://iec.ch/TC57/2014/CIM-schema-cim16#" xmlns:its="http://intechs.by#"
              xmlns:cim17="http://iec.ch/TC57/2014/CIM-schema-cim17#" xmlns:me="http://monitel.com/2014/schema-cim16#" xmlns:rf="http://gost.ru/2019/schema-cim01#"
              xmlns:rh="http://rushydro.ru/2015/schema-cim16#" xmlns:so="http://so-ups.ru/2015/schema-cim16#" 
              xmlns:dm="http://iec.ch/TC57/61970-552/DifferenceModel/1#" xmlns:md="http://iec.ch/TC57/61970-552/ModelDescription/1#"
              xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
                <dm:DifferenceModel>
                    <md:Model.version>ver:11.6.5.203;ext:4;</md:Model.version>
                    <dm:forwardDifferences>
                       ${forwardDifferences}
                    </dm:forwardDifferences>
                    <dm:reverseDifferences>
                       ${reverseDifferences}
                    </dm:reverseDifferences>
                </dm:DifferenceModel>
            </rdf:RDF>`;
  }
  private getRdfDescriptionData(differenceList: string[], uid: string, class_name: string): string {
    return `<${class_name} rdf:about="${uid}">
              ${differenceList.join('\n')}
            </${class_name}>`;
  }
}
