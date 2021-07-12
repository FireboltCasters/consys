'use strict';

import UrlHelper from './UrlHelper';
import FetchHelper from '../ignoreCoverage/FetchHelper';
import City from '../models/City';
import Event from '../models/Event';
import Street from '../models/Street';

/**
 * EventDownloadHelper class
 *
 * @class EventDownloadHelper
 */
export default class EventDownloadHelper {
  static async downloadEventsForCities(year: number, cities: City[]) {
    let events: Event[] = [];
    for (const city of cities) {
      const cityEvents = await EventDownloadHelper.downloadEventsForCity(
        year,
        city
      );
      events.push(cityEvents);
    }
    return events;
  }

  static async downloadEventsForCity(year: number, city: City) {
    let events: Event[] = [];
    const streets = city.getStreets();
    for (const street of streets) {
      const streetEvents = await EventDownloadHelper.downloadEventsForStreet(
        year,
        city,
        street
      );
      events.push(streetEvents);
    }
    return events;
  }

  static async downloadEventsForStreet(
    year: number,
    city: City,
    street: Street
  ) {
    let events: Event[] = [];
    return events;
  }
}
