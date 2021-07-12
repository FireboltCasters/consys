'use strict';
import Street from './Street';
import FieldHelper from '../helper/FieldHelper';

/**
 * City class
 *
 * @class City
 */
export default class City {
  id: number;
  label: string;
  value: string;
  streets: Street[];

  constructor(id: number, label: string, value: string) {
    this.id = id;
    this.label = label;
    this.value = value;
    this.streets = [];
    if (!this.isValid()) {
      throw new Error('City is not valid!');
    }
  }

  setStreets(streets: Street[]) {
    this.streets = streets;
  }

  getStreets(){
    return this.streets;
  }

  isValid() {
    return (
      !isNaN(this.id) &&
      FieldHelper.hasNotEmptyStringFields(this, 'label', 'value')
    );
  }
}
