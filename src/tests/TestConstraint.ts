import Constraint from '../Constraint';

type Model = {x: number; y: number};
type State = {z: number};

test('Constraint has correct statistics', () => {
  const constraint = new Constraint({
    constraint: 'WHEN $x > $y: $y * $y == #z < #w + #w',
  });
  const modelCounts = constraint.getModelVarOccurrences();
  const stateCounts = constraint.getStateVarOccurrences();
  expect(modelCounts).toStrictEqual({x: 1, y: 3});
  expect(stateCounts).toStrictEqual({z: 1, w: 2});
});

test('Constraint evaluates self and message as expected with true constraint', () => {
  const resource = {
    constraint: 'WHEN $x > $y: $y * $y == #z',
    message: 'x is $x and y is $y and z is #z',
  };
  const constraint = new Constraint<Model, State>(resource);
  const evaluation = constraint.evaluate(
    {
      model: {x: 4, y: 2},
      state: {z: 4},
      functions: {},
    },
    true
  );
  expect(evaluation.consistent).toBe(true);
  expect(evaluation.message).toBe('');
  expect(evaluation.resource).toBe(resource);
  expect(constraint.getResource()).toBe(resource);
});

test('Constraint evaluates self and message as expected with false constraint', () => {
  const resource = {
    constraint: 'WHEN $x > $y: $y * $y == #z',
    message: 'x is $x and y is $y and z is #z',
  };
  const constraint = new Constraint<Model, State>(resource);
  const evaluation = constraint.evaluate(
    {
      model: {x: 4, y: 2},
      state: {z: 5},
      functions: {},
    },
    true
  );
  expect(evaluation.consistent).toBe(false);
  expect(evaluation.message).toBe('x is 4 and y is 2 and z is 5');
  expect(evaluation.resource).toBe(resource);
});

test('Constraint throws error when called with invalid arguments', () => {
  let constraint = new Constraint({
    constraint: 'WHEN $x > $y: $y * $y == #z',
    message: 'x is $x and y is $y and z is #z',
  });
  expect(
    constraint.evaluate(
      {
        model: {x: 4},
        state: {z: 5},
        functions: {},
      },
      true
    ).consistent
  ).toBe(false);
  constraint = new Constraint({
    constraint: 'WHEN $x > $y THEN $y * $y == #z',
  });
  expect(
    constraint.evaluate(
      {
        model: {x: 4, y: 2},
        state: {w: 5},
        functions: {},
      },
      true
    ).consistent
  ).toBe(false);
});
