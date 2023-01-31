import Lexer from '../dsl/Lexer';
import Token, {TokenType} from '../dsl/Token';

const lexerScanFromSource: (source: string) => Token[] = (source: string) => {
  const lexer = new Lexer(source);
  return lexer.scan();
};

test('Lexer throws error on invalid symbols', () => {
  expect(() => lexerScanFromSource('WHEN 4 == 2: ^-^')).toThrowError();
  expect(() => lexerScanFromSource('ALWAYS : 4 & 2')).toThrowError();
  expect(() => lexerScanFromSource('ALWAYS : 4 | 2')).toThrowError();
  expect(() => lexerScanFromSource('ALWAYS : 4 = 2')).toThrowError();
});

test('Lexer returns single eof token on empty source', () => {
  const tokens = lexerScanFromSource('');
  expect(tokens.length).toBe(1);
  expect(tokens[0].type).toBe(TokenType.EOF);
});

test('Lexer throws error on unterminated strings', () => {
  expect(() => lexerScanFromSource(`WHEN ('Test'') : 1 < 3`)).toThrowError();
});

test('Lexer correctly identifies all tokens', () => {
  const expectedTokens: {
    type: TokenType;
    lexeme: string;
    literal: any;
    position?: number;
  }[] = [
    {type: TokenType.PARENTHESIS_OPEN, lexeme: '(', literal: null},
    {type: TokenType.PARENTHESIS_CLOSE, lexeme: ')', literal: null},
    {type: TokenType.PLUS, lexeme: '+', literal: null},
    {type: TokenType.MINUS, lexeme: '-', literal: null},
    {type: TokenType.COMMA, lexeme: ',', literal: null},
    {type: TokenType.DOT, lexeme: '.', literal: null},
    {type: TokenType.COLON, lexeme: ':', literal: null},
    {type: TokenType.SLASH, lexeme: '/', literal: null},
    {type: TokenType.STAR, lexeme: '*', literal: null},
    {type: TokenType.PERCENT, lexeme: '%', literal: null},
    {type: TokenType.DOLLAR, lexeme: '$', literal: null},
    {type: TokenType.HASH, lexeme: '#', literal: null},
    {type: TokenType.EXCLAMATION_MARK, lexeme: '!', literal: null},
    {type: TokenType.EXCLAMATION_MARK_EQUAL, lexeme: '!=', literal: null},
    {type: TokenType.EQUAL_EQUAL, lexeme: '==', literal: null},
    {type: TokenType.GREATER, lexeme: '>', literal: null},
    {type: TokenType.GREATER_EQUAL, lexeme: '>=', literal: null},
    {type: TokenType.LESS, lexeme: '<', literal: null},
    {type: TokenType.LESS_EQUAL, lexeme: '<=', literal: null},
    {type: TokenType.PIPE_PIPE, lexeme: '||', literal: null},
    {type: TokenType.AMPERSAND_AMPERSAND, lexeme: '&&', literal: null},
    {type: TokenType.IDENTIFIER, lexeme: 'TEST', literal: null},
    {type: TokenType.IDENTIFIER, lexeme: 'A_b_C', literal: null},
    {type: TokenType.IDENTIFIER, lexeme: '__42', literal: null},
    {type: TokenType.STRING, lexeme: "'Test'", literal: 'Test'},
    {type: TokenType.STRING, lexeme: "'(Test)'", literal: '(Test)'},
    {type: TokenType.STRING, lexeme: "'$ident._42'", literal: '$ident._42'},
    {type: TokenType.NUMBER, lexeme: '42', literal: 42},
    {type: TokenType.NUMBER, lexeme: '42.43', literal: 42.43},
    {type: TokenType.NUMBER, lexeme: '43.00000001', literal: 43.00000001},
    {type: TokenType.ALWAYS, lexeme: 'ALWAYS', literal: true},
    {type: TokenType.ALWAYS, lexeme: 'always', literal: true},
    {type: TokenType.ALWAYS, lexeme: 'Always', literal: true},
    {type: TokenType.WHEN, lexeme: 'WHEN', literal: null},
    {type: TokenType.WHEN, lexeme: 'when', literal: null},
    {type: TokenType.WHEN, lexeme: 'When', literal: null},
    {type: TokenType.THEN, lexeme: 'THEN', literal: null},
    {type: TokenType.THEN, lexeme: 'then', literal: null},
    {type: TokenType.THEN, lexeme: 'Then', literal: null},
    {type: TokenType.AND, lexeme: 'AND', literal: null},
    {type: TokenType.AND, lexeme: 'and', literal: null},
    {type: TokenType.AND, lexeme: 'And', literal: null},
    {type: TokenType.OR, lexeme: 'OR', literal: null},
    {type: TokenType.OR, lexeme: 'or', literal: null},
    {type: TokenType.OR, lexeme: 'Or', literal: null},
    {type: TokenType.NOT, lexeme: 'NOT', literal: null},
    {type: TokenType.NOT, lexeme: 'not', literal: null},
    {type: TokenType.NOT, lexeme: 'Not', literal: null},
    {type: TokenType.EOF, lexeme: '', literal: null},
  ];
  const whitespace = ['\n', ' ', '\t', '\r'];
  let source = '';
  let position = 0;
  for (let i = 0; i < expectedTokens.length; i++) {
    const expected = expectedTokens[i];
    const separator = whitespace[i % whitespace.length];
    expected.position = position;
    source += expected.lexeme;
    if (i < expectedTokens.length - 1) {
      source += separator;
    }
    position = source.length;
  }
  const tokens = lexerScanFromSource(source);
  expect(tokens.length).toBe(expectedTokens.length);
  for (let i = 0; i < expectedTokens.length; i++) {
    let expected = expectedTokens[i];
    let got = tokens[i];
    expect(expected.type).toBe(got.type);
    if (expected.type === TokenType.STRING) {
      expect(expected.lexeme).toBe(`'${got.lexeme}'`);
    } else {
      expect(expected.lexeme).toBe(got.lexeme);
    }
    expect(expected.literal).toBe(got.literal);
    expect(expected.position).toBe(got.position);
  }
});
