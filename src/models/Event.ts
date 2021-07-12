'use strict';
import FieldHelper from '../helper/FieldHelper';

/**
 * Event class
 *
 * @class Event
 */
export default class Event {
  date: Date;
  label: string;
  provider: string;

  constructor(date: Date, label: string, provider: string) {
    this.date = date;
    this.label = label;
    this.provider = provider;
    if (!this.isValid()) {
      throw new Error('Event is not valid!');
    }
  }

  isValid() {
    return (
      Object.prototype.toString.call(this.date) === '[object Date]' && //check if valid date //https://stackoverflow.com/questions/643782/how-to-check-whether-an-object-is-a-date
      FieldHelper.hasNotEmptyStringFields(this, 'label', 'provider')
    );
  }
}
