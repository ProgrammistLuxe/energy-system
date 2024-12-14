import { Injectable } from '@angular/core';
import { Difference } from '../models/difference.model';

@Injectable()
export class GenerateDiffService {
  private getRdfDifferenceModal(forwardDifferences: string, reverseDifferences: string) {
    return `<rdf:RDF xmlns:cim="http://iec.ch/TC57/2014/CIM-schema-cim16#"
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
    return `<rdf:Description rdf:about="${uid}" me:className="${class_name}">
              ${differenceList.join('\n')}
            </rdf:Description>`;
  }
  generateDiff(difference: Difference, uid: string, class_name: string): string {
    const forwardDifferenceList: string[] = [];
    const reverseDifferenceList: string[] = [];
    Object.keys(difference).forEach((key) => {
      const forwardDiffItem = `<cim:${key}>${difference[key].currentValue}</cim:${key}>`;
      const reversDiffItem = `<cim:${key}>${difference[key].oldValue}</cim:${key}>`;
      forwardDifferenceList.push(forwardDiffItem);
      reverseDifferenceList.push(reversDiffItem);
    });
    const forwardDifferences: string = this.getRdfDescriptionData(forwardDifferenceList, uid, class_name);
    const reverseDifferences: string = this.getRdfDescriptionData(reverseDifferenceList, uid, class_name);
    const diff = this.getRdfDifferenceModal(forwardDifferences, reverseDifferences);
    return diff;
  }
}
