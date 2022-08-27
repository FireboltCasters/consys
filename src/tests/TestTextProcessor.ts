import TextProcessor from '../dsl/TextProcessor';

const processText: (
  text: string,
  model?: any,
  state?: any,
  functions?: any
) => string = (text: string, model?: any, state?: any, functions?: any) => {
  const processor = new TextProcessor(text);
  return processor.process(model, state, functions);
};

test('TextProcessor does not replace anything when no tokens need to be replaced', () => {
  expect(processText('')).toBe('');
  expect(processText('Text')).toBe('Text');
});

test('TextProcessor correctly replaces model variables', () => {
  let model = {first: 4, second: {third: 2}};
  expect(processText('First value is $first', model)).toBe('First value is 4');
  expect(processText('First value is$first', model)).toBe('First value is4');
  expect(processText('First value is$first.', model)).toBe('First value is4.');
  expect(processText('First value is $first$first', model)).toBe(
    'First value is 44'
  );
  expect(processText('Value is $first$second.third', model)).toBe(
    'Value is 42'
  );
  expect(processText('$first.$second.third', model)).toBe('4.2');
  expect(processText('$first..$second.third', model)).toBe('4..2');
  expect(processText('$first.$second..third', model)).toBe(
    '4.[object Object]..third'
  );
  expect(processText('$', model)).toBe('{"first":4,"second":{"third":2}}');
  expect(processText('.$.', model)).toBe('.{"first":4,"second":{"third":2}}.');
  expect(processText('.$$.', model)).toBe(
    '.{"first":4,"second":{"third":2}}{"first":4,"second":{"third":2}}.'
  );
});

test('TextProcessor correctly replaces state variables', () => {
  let state = {first: 4, second: {third: 2}};
  expect(processText('First value is #first', undefined, state)).toBe(
    'First value is 4'
  );
  expect(processText('First value is#first', undefined, state)).toBe(
    'First value is4'
  );
  expect(processText('First value is#first.', undefined, state)).toBe(
    'First value is4.'
  );
  expect(processText('First value is #first#first', undefined, state)).toBe(
    'First value is 44'
  );
  expect(processText('Value is #first#second.third', undefined, state)).toBe(
    'Value is 42'
  );
  expect(processText('#first.#second.third', undefined, state)).toBe('4.2');
  expect(processText('#first..#second.third', undefined, state)).toBe('4..2');
  expect(processText('#first.#second..third', undefined, state)).toBe(
    '4.[object Object]..third'
  );
  expect(processText('#', undefined, state)).toBe(
    '{"first":4,"second":{"third":2}}'
  );
  expect(processText('.#.', undefined, state)).toBe(
    '.{"first":4,"second":{"third":2}}.'
  );
  expect(processText('.##.', undefined, state)).toBe(
    '.{"first":4,"second":{"third":2}}{"first":4,"second":{"third":2}}.'
  );
});

test('TextProcessor correctly replaces function calls', () => {
  const model = {value: 42};
  const functions = {
    stringLength: (text: string) => text.length,
    add: (a: number, b: number) => a + b,
    __0F_unc1_: () => 'replaced',
  };
  expect(
    processText(
      `Function call stringLength('test')`,
      model,
      undefined,
      functions
    )
  ).toBe('Function call 4');
  expect(
    processText(
      `stringLength('test')Function call`,
      model,
      undefined,
      functions
    )
  ).toBe('4Function call');
  expect(
    processText(`Function call add(40, 2)`, model, undefined, functions)
  ).toBe('Function call 42');
  expect(
    processText(`Function.add($value, 42)`, model, undefined, functions)
  ).toBe('Function.84');
  expect(
    processText(
      `Function(add($value, add(40, 2)))`,
      model,
      undefined,
      functions
    )
  ).toBe('Function(84)');
  expect(
    processText(
      `Function(add($value, add(40, 2)))`,
      model,
      undefined,
      functions
    )
  ).toBe('Function(84)');
  expect(
    processText(`Function(add($value,add(40,2))`, model, undefined, functions)
  ).toBe('Function(84');
  expect(
    processText(
      `Function.add($value, add(40, 2)))`,
      model,
      undefined,
      functions
    )
  ).toBe('Function.84)');
  expect(
    processText(
      `a()())(add($value, 19 + 21)b)c())`,
      model,
      undefined,
      functions
    )
  ).toBe('a()())(82b)c())');
  expect(
    processText(`a()())(__0F_unc1_)c())`, model, undefined, functions)
  ).toBe('a()())(replaced)c())');
  expect(
    processText(`__0F_unc1_.a()())()c())`, model, undefined, functions)
  ).toBe('replaced.a()())()c())');
});

test('TextProcessor correctly handles all cases together', () => {
  const model = {value: 42};
  const state = {superior: 43};
  const functions = {
    stringLength: (text: string) => text.length,
    add: (a: number, b: number) => a + b,
    __0F_unc1_: () => 'replaced',
    EXPR: (model: any, state: any) => model.value + state.superior,
  };
  expect(
    processText(`$value.#superior|__0F_unc1_`, model, state, functions)
  ).toBe('42.43|replaced');
  expect(
    processText(`$value.#superior|__0F_unc1_()`, model, state, functions)
  ).toBe('42.43|replaced');
  expect(
    processText(`$value#.superior__0F_unc1_()`, model, state, functions)
  ).toBe('42{"superior":43}.superior__0F_unc1_()');
  expect(
    processText(`$value#4stringLength('$')`, model, state, functions)
  ).toBe('42{"superior":43}41');
  expect(
    processText(
      `add(stringLength('$'), 40 + 1)__0F_unc1_`,
      model,
      state,
      functions
    )
  ).toBe('42replaced');
  expect(
    processText(`add(stringLength(__0F_unc1_), 42)`, model, state, functions)
  ).toBe('50');
  expect(
    processText(`add(stringLength(__0F_unc1_), EXPR)`, model, state, functions)
  ).toBe('93');
});
