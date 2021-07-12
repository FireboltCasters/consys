import StreetDownloadHelper from '../helper/StreetDownloadHelper';
const year = new Date().getFullYear();

test('Test searchStreetOnly', async () => {
  const streetSearchName = 'Bernhardstra';
  const expectedStreetName = 'Bernhardstraße';
  const dinklageId = 3;
  const streets = await StreetDownloadHelper.searchStreetOnly(
    year,
    dinklageId,
    streetSearchName
  );
  expect(streets).toBeTruthy();
  expect(streets.length).toBe(1);
  expect(streets[0].label).toBe(expectedStreetName);
});

test('Test searchStreetOnly without matches', async () => {
  const streetSearchName = 'MaxMustermann Straße';
  const dinklageId = 3;
  const streets = await StreetDownloadHelper.searchStreetOnly(
    year,
    dinklageId,
    streetSearchName
  );
  expect(streets).toBeTruthy();
  expect(streets.length).toBe(0);
});
