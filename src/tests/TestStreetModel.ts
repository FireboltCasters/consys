import Street from '../models/Street';

const id = 6;
const label = 'Label';
const value = 'Value';
const pamo = '0';
const siemer = '2';
const abfuhrbezirk = '1';
let street: Street;

beforeEach(() => {
  street = new Street(id, label, value, pamo, siemer, abfuhrbezirk);
});

test('Test street constructor', async () => {
  expect(street.id).toBe(id);
  expect(street.label).toBe(label);
  expect(street.value).toBe(value);
  expect(street.pamo).toBe(pamo);
  expect(street.siemer).toBe(siemer);
  expect(street.abfuhrbezirk).toBe(abfuhrbezirk);
});

test('Test invalid street', async () => {
  expect(() => {
    // @ts-ignore //ignore invalid type passing
    const invalidStreet = new Street('a', null, null, null, null, null);
    console.log(invalidStreet); //to suppress unused variable
  }).toThrow();
});
