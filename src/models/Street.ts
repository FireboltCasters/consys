'use strict';

import FieldHelper from '../helper/FieldHelper';

/**
 * Street class
 *
 * @class Street
 */
export default class Street {
  id: number;
  label: string;
  value: string;
  pamo: string;
  siemer: string;
  abfuhrbezirk: string;

  constructor(
    id: number,
    label: string,
    value: string,
    pamo: string,
    siemer: string,
    abfuhrbezirk: string
  ) {
    this.id = id;
    this.label = label;
    this.value = value;
    this.pamo = pamo;
    this.siemer = siemer;
    this.abfuhrbezirk = abfuhrbezirk;
    if (!this.isValid()) {
      throw new Error('Street is not valid! ' + this.toString());
    }
  }

  isValid() {
    return (
      !isNaN(this.id) &&
      FieldHelper.hasNotEmptyStringFields(
        this,
        'label',
        'value',
        'pamo',
        'siemer',
        'abfuhrbezirk'
      )
    );
  }
}
