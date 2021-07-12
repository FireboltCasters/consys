'use strict';

/**
 * UrlHelper class
 *
 * @class UrlHelper
 */
export default class UrlHelper {
  static BASE_URL = 'https://www.abfallwirtschaft-vechta.de/CALENDER';
  static SEARCH_CITY_URL = UrlHelper.BASE_URL + '/inc.suche_stadt.php?term=';
  static SEARCH_STREET_BASE_URL =
    UrlHelper.BASE_URL + '/inc.suche_strasse.php?stadt=';

  static CALENDAR_URL = UrlHelper.BASE_URL + '/inc.get_calender.php';

  static getCitySearchURL(containsLetter: string) {
    return UrlHelper.SEARCH_CITY_URL + containsLetter;
  }

  static getStreetSearchURL(cityId: number, containsLetter: string) {
    return (
      UrlHelper.SEARCH_STREET_BASE_URL + cityId + '&term=' + containsLetter
    );
  }
}
