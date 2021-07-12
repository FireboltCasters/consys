import Consys from '../Consys';

test('Basic test example', async () => {
  const myVariable = 4;
  expect(Consys.exampleValue(myVariable)).toBe(myVariable);
});
