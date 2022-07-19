import Lexer from "../dsl/Lexer";
import Token, {TokenType} from "../dsl/Token";

const lexerScanFromSource: (source: string) => Token[] = (source: string) => {
    const lexer = new Lexer(source);
    return lexer.scan();
};

test('Lexer throws error on invalid symbols', () => {
    expect(() => lexerScanFromSource('WHEN 4 == 2: ^-^')).toThrowError();
    expect(() => lexerScanFromSource('ALWAYS : 4 & 2')).toThrowError();
    expect(() => lexerScanFromSource('ALWAYS : 4 | 2')).toThrowError();
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
    const expectedTokens: { type: TokenType, lexeme: string, position?: number }[] = [
        { type: TokenType.PARENTHESIS_OPEN,         lexeme: "(" },
        { type: TokenType.PARENTHESIS_CLOSE,        lexeme: ")" },
        { type: TokenType.PLUS,                     lexeme: "+" },
        { type: TokenType.MINUS,                    lexeme: "-" },
        { type: TokenType.COMMA,                    lexeme: "," },
        { type: TokenType.DOT,                      lexeme: "." },
        { type: TokenType.COLON,                    lexeme: ":" },
        { type: TokenType.SLASH,                    lexeme: "/" },
        { type: TokenType.STAR,                     lexeme: "*" },
        { type: TokenType.PERCENT,                  lexeme: "%" },
        { type: TokenType.DOLLAR,                   lexeme: "$" },
        { type: TokenType.HASH,                     lexeme: "#" },
        { type: TokenType.EXCLAMATION_MARK,         lexeme: "!" },
        { type: TokenType.EXCLAMATION_MARK_EQUAL,   lexeme: "!=" },
        { type: TokenType.EQUAL_EQUAL,              lexeme: "==" },
        { type: TokenType.GREATER,                  lexeme: ">" },
        { type: TokenType.GREATER_EQUAL,            lexeme: ">=" },
        { type: TokenType.LESS,                     lexeme: "<" },
        { type: TokenType.LESS_EQUAL,               lexeme: "<=" },
        { type: TokenType.PIPE_PIPE,                lexeme: "||" },
        { type: TokenType.AMPERSAND_AMPERSAND,      lexeme: "&&" },
        { type: TokenType.IDENTIFIER,               lexeme: "TEST" },
        { type: TokenType.IDENTIFIER,               lexeme: "A_b_C" },
        { type: TokenType.IDENTIFIER,               lexeme: "__42" },
        { type: TokenType.STRING,                   lexeme: "'Test'" },
        { type: TokenType.STRING,                   lexeme: "'(Test)'" },
        { type: TokenType.STRING,                   lexeme: "'$ident._42'" },
        { type: TokenType.NUMBER,                   lexeme: "42" },
        { type: TokenType.NUMBER,                   lexeme: "42.43" },
        { type: TokenType.NUMBER,                   lexeme: "43.00000001" },
        { type: TokenType.ALWAYS,                   lexeme: "ALWAYS" },
        { type: TokenType.WHEN,                     lexeme: "WHEN" },
        { type: TokenType.AND,                      lexeme: "AND" },
        { type: TokenType.OR,                       lexeme: "OR" },
        { type: TokenType.NOT,                      lexeme: "NOT" },
        { type: TokenType.EOF,                      lexeme: "" },
    ];
    const whitespace = ["\n", " ", "\t", "\r"];
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
        expect(expected.position).toBe(got.position);
    }
});
