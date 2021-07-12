'use strict';

import UrlHelper from './UrlHelper';
import FetchHelper from '../ignoreCoverage/FetchHelper';
import Street from '../models/Street';

/**
 * StreetDownloadHelper class
 *
 * @class StreetDownloadHelper
 */
export default class StreetDownloadHelper {
  //Response jQuery18308012909501872008_1616924580830({"strassen":[{"id":"542","label":"Bernhardstraße","value":"Bernhardstraße","pamo":"4","siemer":"1","abfuhrbezirk":"1"});
  static async searchStreetOnly(
    year: number,
    cityId: number,
    streetSearchContainsName: string
  ) {
    const url = UrlHelper.getStreetSearchURL(cityId, streetSearchContainsName);
    const response = await FetchHelper.fetchWithCookie(
      url,
      year,
      cityId,
      null,
      null,
      null,
      null
    );
    const answer = await response.text();
    const listOfStreetJSONRaw =
      StreetDownloadHelper.extractStreetJSONResponse(answer);
    return StreetDownloadHelper.transformStreetResponceToClass(
      listOfStreetJSONRaw
    );
  }

  static extractStreetJSONResponse(answer: any) {
    const substring = answer.substr(1, answer.length - (1 + 2)); //remove brackets and semicolon
    const streetJSON = JSON.parse(substring); // then parse to json
    return streetJSON['strassen'];
  }

  static transformStreetResponceToClass(listOfStreetJSON: any[]) {
    const streets = [];
    for (const streetJSON of listOfStreetJSON) {
      if (streetJSON.id !== 'false') {
        const street = new Street(
          parseInt(streetJSON.id),
          streetJSON.label,
          streetJSON.value,
          streetJSON.pamo,
          streetJSON.siemer,
          streetJSON.abfuhrbezirk
        );
        streets.push(street);
      }
    }
    return streets;
  }
}
