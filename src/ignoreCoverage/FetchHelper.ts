'use strict';
const fetch = require('node-fetch');

/**
 * FetchHelper class
 *
 * @class FetchHelper
 */
export default class FetchHelper {
  static getCookie(
    year: number,
    cityId: any | '',
    streetId: any | '',
    abfuhrbezirkId: any | '',
    papier: any | '',
    abfuhrbezirkpapier: any | ''
  ) {
    return [
      'jahr=' +
        year +
        '; stadt=' +
        cityId +
        '; strasse=' +
        streetId +
        '; abfuhrbezirk=' +
        abfuhrbezirkId +
        '; papier=' +
        papier +
        '; abfuhrbezirkpapier=' +
        abfuhrbezirkpapier,
    ];
  }

  static async fetchWithCookie(
    url: string,
    year: number,
    cityId: any,
    streetId: any,
    abfuhrbezirkId: any,
    papier: any,
    abfuhrbezirkpapier: any
  ) {
    const cookie = FetchHelper.getCookie(
      year,
      cityId,
      streetId,
      abfuhrbezirkId,
      papier,
      abfuhrbezirkpapier
    );
    return fetch(url, {
      method: 'GET',
      headers: {
        cookie: cookie,
      },
    });
  }
}
