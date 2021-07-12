'use strict';

import UrlHelper from './UrlHelper';
import FetchHelper from '../ignoreCoverage/FetchHelper';
import City from '../models/City';

/**
 * DownloadHelper class
 *
 * @class CityDownloadHelper
 */
export default class CityDownloadHelper {
  static async searchCityOnly(year: number, citySearchContainsName: string) {
    const url = UrlHelper.getCitySearchURL(citySearchContainsName);
    const response = await FetchHelper.fetchWithCookie(
      url,
      year,
      null,
      null,
      null,
      null,
      null
    );
    const listOfCityJSON = await response.json();
    return CityDownloadHelper.transformCityResponceToClass(listOfCityJSON);
  }

  static transformCityResponceToClass(listOfCityJSON: any[]) {
    const cities = [];
    for (const cityJSON of listOfCityJSON) {
      const city = new City(
        parseInt(cityJSON.id),
        cityJSON.label,
        cityJSON.value
      );
      cities.push(city);
    }
    return cities;
  }
}
