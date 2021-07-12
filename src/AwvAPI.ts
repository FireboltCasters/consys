'use strict';
import CityDownloadHelper from './helper/CityDownloadHelper';
import StreetDownloadHelper from './helper/StreetDownloadHelper';
import City from './models/City';
import Street from './models/Street';

/**
 * Consys class
 *
 * @class Consys
 */
export default class Consys {

  static async downloadAllCitiesAndStreets(year: number) {
    const allCities = await Consys.downloadAllCities(year);
    for (const city of allCities) {
      const allStreetsForCity = await Consys.downloadAllStreetsForCity(
        year,
        city
      );
      city.setStreets(allStreetsForCity);
    }
  }

  static async downloadAllCities(year: number) {
    return CityDownloadHelper.searchCityOnly(year, '');
  }

  static async downloadAllStreetsForCity(year: number, city: City) {
    return StreetDownloadHelper.searchStreetOnly(year, city.id, '');
  }

  static async downloadEventsForStreet(year: number, street: Street) {

  }
}
