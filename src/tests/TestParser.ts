import {Expression} from '../dsl/Expression';
import Lexer from '../dsl/Lexer';
import Parser from '../dsl/Parser';

const parseFromSource: (source: string) => Expression.AST = (
  source: string
) => {
  const lexer = new Lexer(source);
  const tokens = lexer.scan();
  const parser = new Parser(source, tokens);
  return parser.parse();
};

test("Parser throws error when syntax is not 'activation : assertion'", () => {
  expect(() => parseFromSource('')).toThrowError();
  expect(() => parseFromSource(':')).toThrowError();
  expect(() => parseFromSource('THEN')).toThrowError();
  expect(() => parseFromSource('::')).toThrowError();
  expect(() => parseFromSource(':::')).toThrowError();
  expect(() => parseFromSource(':THEN:')).toThrowError();
  expect(() => parseFromSource('ALWAYS:')).toThrowError();
  expect(() => parseFromSource(':TRUE')).toThrowError();
  expect(() => parseFromSource('1:1')).toThrowError();
  expect(() => parseFromSource('1THEN1')).toThrowError();
});

test('Parser throws error on unexpected tokens', () => {
  expect(() => parseFromSource('WHEN WHEN : 1 < 3')).toThrowError();
  expect(() => parseFromSource('WHEN WHEN THEN 1 < 3')).toThrowError();
  expect(() => parseFromSource('WHEN 1 < 3 : WHEN')).toThrowError();
  expect(() => parseFromSource('ALWAYS ALWAYS : 1 < 3')).toThrowError();
  expect(() => parseFromSource('ALWAYS 1 < 3 : ALWAYS')).toThrowError();
  expect(() => parseFromSource('ALWAYS 1 < 3 THEN ALWAYS')).toThrowError();
  expect(() => parseFromSource('1 < 3 : 1 < 3')).toThrowError();
  expect(() => parseFromSource('ALWAYS : 1 < 3 < 5')).toThrowError();
  expect(() => parseFromSource('ALWAYS : 1 < 3 5')).toThrowError();
  expect(() => parseFromSource('ALWAYS : 1 3 < 5')).toThrowError();
  expect(() => parseFromSource('ALWAYS : 1 3')).toThrowError();
  expect(() => parseFromSource('ALWAYS : #a$b')).toThrowError();
  expect(() => parseFromSource('ALWAYS THEN #a$b')).toThrowError();
  expect(() => parseFromSource('WHEN #a#b : 1 < 3')).toThrowError();
  expect(() => parseFromSource('IF #a#b : 1 < 3')).toThrowError();
  expect(() => parseFromSource('ALWAYS : 1 <> 3')).toThrowError();
  expect(() => parseFromSource('ALWAYS : 1 < 3 <')).toThrowError();
  expect(() => parseFromSource('ALWAYS : 1 <')).toThrowError();
  expect(() => parseFromSource('ALWAYS : 2 < 4.')).toThrowError();
});

test('Parser does not throw error from valid syntax', () => {
  expect(!!parseFromSource('ALWAYS : TRUE').root).toBe(true);
  expect(!!parseFromSource('ALWAYS THEN TRUE').root).toBe(true);
  expect(!!parseFromSource('WHEN TRUE : TRUE').root).toBe(true);
  expect(!!parseFromSource('WHEN TRUE THEN TRUE').root).toBe(true);
  expect(!!parseFromSource('IF TRUE THEN TRUE').root).toBe(true);
  expect(!!parseFromSource('TRUE : TRUE').root).toBe(true);
  expect(!!parseFromSource('ALWAYS : A < $B + #C').root).toBe(true);
  expect(!!parseFromSource('ALWAYS THEN A < $B + #C').root).toBe(true);
  expect(!!parseFromSource('ALWAYS : A <= $B - #C || D').root).toBe(true);
  expect(!!parseFromSource('ALWAYS : A == $B * #C OR D AND E').root).toBe(true);
  expect(!!parseFromSource('ALWAYS : A != $B / #C OR D && E').root).toBe(true);
  expect(!!parseFromSource('ALWAYS THEN A != $B / #C OR D && E').root).toBe(
    true
  );
  expect(
    !!parseFromSource('ALWAYS : A >= $B / #C OR D && E % F > G').root
  ).toBe(true);
  expect(
    !!parseFromSource('ALWAYS : -A >= ($B / #C) OR D && NOT E % F > !G').root
  ).toBe(true);
});

test('Parser generates valid AST from valid syntax', () => {
  const ast = parseFromSource(
    'ALWAYS : -A >= ($B / #C) OR D && NOT E % F > !G'
  );
  const astString = ast.toString();
  const expected =
    "(activation ([ALWAYS] 'ALWAYS') " +
    'assertion (OR (>= (- (A )) (group (/ $ B # C))) (&& (D ) (> (% (NOT (E )) (F )) (! (G ))))))';
  expect(astString).toBe(expected);
});
