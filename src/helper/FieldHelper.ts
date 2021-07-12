'use strict';

/**
 * FieldHelper class
 *
 * @class FieldHelper
 */
export default class FieldHelper {
  static isNotEmptyString(string: any) {
    return !!string && string.length > 0;
  }

  static hasNotEmptyStringFields(object: any, ...fields: string[]) {
    for (const field of fields) {
      const value: any = object[field];
      if (!FieldHelper.isNotEmptyString(value)) {
        return false;
      }
    }
    return true;
  }
}
