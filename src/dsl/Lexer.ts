import Token, {TokenType} from "./Token";
import {Log} from "../Util";

export default class Lexer {

    private static readonly singleCharTokens: { [key: string]: TokenType } = {
        "(":        TokenType.PARENTHESIS_OPEN,
        ")":        TokenType.PARENTHESIS_CLOSE,
        "+":        TokenType.PLUS,
        "-":        TokenType.MINUS,
        ",":        TokenType.COMMA,
        ".":        TokenType.DOT,
        ":":        TokenType.COLON,
        "/":        TokenType.SLASH,
        "*":        TokenType.STAR,
        "%":        TokenType.PERCENT,
        "$":        TokenType.DOLLAR,
        "#":        TokenType.HASH
    };

    private static readonly keywords: { [key: string]: TokenType } = {
        "ALWAYS":   TokenType.ALWAYS,
        "WHEN":     TokenType.WHEN,
        "AND":      TokenType.AND,
        "OR":       TokenType.OR,
        "NOT":      TokenType.NOT
    };

    private static isDigit(symbol: string): boolean {
        return !!symbol.match(/\d/);
    }

    private static isAlpha(symbol: string): boolean {
        return !!symbol.match(/[a-zA-Z]|_/);
    }

    private static isAlphaNumeric(symbol: string): boolean {
        return Lexer.isDigit(symbol) || Lexer.isAlpha(symbol);
    }

    private readonly tokens: Token[]    = [];
    private readonly source: string     = "";
    private start: number               = 0;
    private current: number             = 0;

    constructor(source: string) {
        this.source = source;
    }

    scan(): Token[] {
        while (!this.isAtEnd()) {
            this.start = this.current;
            this.scanToken();
        }
        this.tokens.push(new Token(TokenType.EOF, "", this.source.length));
        return this.tokens;
    }

    private scanToken() {
        let currentSymbol = this.advance();
        if (Lexer.singleCharTokens[currentSymbol] !== undefined) {
            this.emitToken(Lexer.singleCharTokens[currentSymbol]);
            return;
        }
        switch (currentSymbol) {
            case "!":
                this.emitToken(this.match("=") ? TokenType.EXCLAMATION_MARK_EQUAL : TokenType.EXCLAMATION_MARK);
                break;
            case "=":
                if (!this.match("=")) {
                    throw this.errorOnPosition("Single '=' is not allowed, did you mean '=='?");
                }
                this.emitToken(TokenType.EQUAL_EQUAL);
                break;
            case "<":
                this.emitToken(this.match("=") ? TokenType.LESS_EQUAL : TokenType.LESS);
                break;
            case ">":
                this.emitToken(this.match("=") ? TokenType.GREATER_EQUAL : TokenType.GREATER);
                break;
            case "|":
                if (!this.match("|")) {
                    throw this.errorOnPosition("Single '|' is not allowed, did you mean '||'?");
                }
                this.emitToken(TokenType.PIPE_PIPE);
                break;
            case "&":
                if (!this.match("&")) {
                    throw this.errorOnPosition("Single '&' is not allowed, did you mean '&&'?");
                }
                this.emitToken(TokenType.AMPERSAND_AMPERSAND);
                break;
            case "'":
                this.handleString();
                break;
            case " ":
            case "\r":
            case "\t":
            case "\n":
                // ignore whitespace and new lines
                break;
            default:
                if (Lexer.isDigit(currentSymbol)) {
                    this.handleNumber();
                } else if (Lexer.isAlpha(currentSymbol)) {
                    this.handleIdentifier();
                } else {
                    throw this.errorOnPosition(`Unexpected character '${currentSymbol}'`);
                }
                break;
        }
    }

    private handleString() {
        // ignore symbols until we find the matching quote
        while (this.peek() !== "'" && !this.isAtEnd()) {
            this.advance();
        }
        if (this.isAtEnd()) {
            throw this.errorOnPosition("Unterminated string", this.start);
        }
        // we are on the enclosing quote, so go to the next symbol
        this.advance();
        this.emitToken(TokenType.STRING, this.start + 1, this.current - 1, this.start);
    }

    private handleNumber() {
        while (Lexer.isDigit(this.peek())) {
            this.advance();
        }
        // for non-integer values, look for the dot separator
        if (this.peek() == "." && Lexer.isDigit(this.peekNext())) {
            this.advance();
            while (Lexer.isDigit(this.peek())) {
                this.advance();
            }
        }
        this.emitToken(TokenType.NUMBER);
    }

    private handleIdentifier() {
        while (Lexer.isAlphaNumeric(this.peek())) {
            this.advance();
        }
        let identifier = this.source.substring(this.start, this.current);
        let type = Lexer.keywords[identifier];
        if (!type) {
            type = TokenType.IDENTIFIER;
        }
        this.emitToken(type);
    }

    private isAtEnd(): boolean {
        return this.current >= this.source.length;
    }

    private advance(): string {
        return this.source.charAt(this.current++);
    }

    private match(expected: string): boolean {
        if (this.isAtEnd()) {
            return false;
        }
        if (this.source.charAt(this.current) !== expected) {
            return false;
        }
        this.current++;
        return true;
    }

    private peek(): string {
        if (this.isAtEnd()) {
            return "\0";
        }
        return this.source.charAt(this.current);
    }

    private peekNext(): string {
        if (this.current + 1 >= this.source.length) {
            return "\0";
        }
        return this.source.charAt(this.current + 1);
    }

    private emitToken(type: TokenType, begin: number = this.start, end: number = this.current, position: number = begin) {
        this.tokens.push(new Token(type, this.source.substring(begin, end), position));
    }

    private errorOnPosition(message: string, position: number = this.current - 1): Error {
        Log.reportSyntaxError(this.source, message, position);
        return Error();
    }
}
