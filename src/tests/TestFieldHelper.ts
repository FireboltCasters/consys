import FieldHelper from '../helper/FieldHelper';

test('Test isNotEmptyString on empty string', async () => {
  expect(FieldHelper.isNotEmptyString(null)).toBe(false);
  expect(FieldHelper.isNotEmptyString('')).toBe(false);
});

test('Test isNotEmptyString on not empty string', async () => {
  expect(FieldHelper.isNotEmptyString('Hello')).toBe(true);
  expect(FieldHelper.isNotEmptyString('a')).toBe(true);
});

test('Test hasNotEmptyStringFields with an empty field', async () => {
  const key = 'A random Key';
  const value = null;
  const object = {[key]: value};
  expect(FieldHelper.hasNotEmptyStringFields(object, key)).toBe(false);
});

test('Test hasNotEmptyStringFields without empty field', async () => {
  const key = 'A random Key';
  const secondKey = key + '2';
  const value = 'A filled field';
  const object = {[key]: value, [secondKey]: value + '2'};
  expect(FieldHelper.hasNotEmptyStringFields(object, key, secondKey)).toBe(
    true
  );
});
