import CityDownloadHelper from '../helper/CityDownloadHelper';
const year = new Date().getFullYear();

test('Test searchCityOnly', async () => {
  const citySearchName = 'Dinklage';
  const cities = await CityDownloadHelper.searchCityOnly(year, citySearchName);
  expect(cities).toBeTruthy();
  expect(cities.length).toBe(1);
  expect(cities[0].label).toBe(citySearchName);
});
