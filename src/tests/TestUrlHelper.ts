import UrlHelper from '../helper/UrlHelper';
const faker = require('faker');

test('Test getCitySearchURL', async () => {
  const containsLetter = faker.address.city();
  const expectation = UrlHelper.SEARCH_CITY_URL + containsLetter;
  expect(UrlHelper.getCitySearchURL(containsLetter)).toBe(expectation);
});

test('Test getStreetSearchURL', async () => {
  const containsLetter = faker.address.streetName();
  const cityId = 4;
  const expectation =
    UrlHelper.SEARCH_STREET_BASE_URL + cityId + '&term=' + containsLetter;
  expect(UrlHelper.getStreetSearchURL(cityId, containsLetter)).toBe(
    expectation
  );
});
