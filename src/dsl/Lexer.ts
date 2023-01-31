import Token, {TokenType} from './Token';
import {Log} from '../Util';

/**
 * The lexer is responsible for reading in source code of the dsl and turn it into a list of meaningful tokens.
 */
export default class Lexer {
  // all tokens that have a single character
  private static readonly singleCharTokens: {[key: string]: TokenType} = {
    '(': TokenType.PARENTHESIS_OPEN,
    ')': TokenType.PARENTHESIS_CLOSE,
    '+': TokenType.PLUS,
    '-': TokenType.MINUS,
    ',': TokenType.COMMA,
    '.': TokenType.DOT,
    ':': TokenType.COLON,
    '/': TokenType.SLASH,
    '*': TokenType.STAR,
    '%': TokenType.PERCENT,
    $: TokenType.DOLLAR,
    '#': TokenType.HASH,
  };

  // all keywords
  private static readonly keywords: {[key: string]: TokenType} = {
    ALWAYS: TokenType.ALWAYS,
    WHEN: TokenType.WHEN,
    AND: TokenType.AND,
    OR: TokenType.OR,
    NOT: TokenType.NOT,
  };

  /**
   * Checks if the given symbol is a digit from 0-9.
   *
   * @param symbol character to check
   * @private
   */
  private static isDigit(symbol: string): boolean {
    return !!symbol.match(/\d/);
  }

  /**
   * Checks if the given symbol is an alphabetic lower- or uppercase value.
   *
   * @param symbol character to check
   * @private
   */
  private static isAlpha(symbol: string): boolean {
    return !!symbol.match(/[a-zA-Z]|_/);
  }

  /**
   * Checks if the given symbol is either a digit or alphabetic.
   *
   * @param symbol character to check
   * @private
   */
  private static isAlphaNumeric(symbol: string): boolean {
    return Lexer.isDigit(symbol) || Lexer.isAlpha(symbol);
  }

  // lexer state
  private readonly tokens: Token[] = [];
  private readonly source: string = '';
  private readonly offset: number = 0;
  private start: number = 0;
  private current: number = 0;

  /**
   * Creates a new lexer instance for a given string of source code
   *
   * @param source source code
   * @param offset index offset into the source code
   */
  constructor(source: string, offset: number = 0) {
    this.source = source;
    this.offset = offset;
  }

  /**
   * Scans the source code and turns it into a list of tokens.
   */
  scan(): Token[] {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.scanToken();
    }
    this.tokens.push(
      new Token(TokenType.EOF, '', null, this.source.length + this.offset)
    );
    return this.tokens;
  }

  /**
   * Scans a single token on the current index.
   * @private
   */
  private scanToken() {
    let currentSymbol = this.advance();
    if (Lexer.singleCharTokens[currentSymbol] !== undefined) {
      this.emitToken(Lexer.singleCharTokens[currentSymbol]);
      return;
    }
    switch (currentSymbol) {
      case '!':
        this.emitToken(
          this.match('=')
            ? TokenType.EXCLAMATION_MARK_EQUAL
            : TokenType.EXCLAMATION_MARK
        );
        break;
      case '=':
        if (!this.match('=')) {
          throw this.errorOnPosition(
            "Single '=' is not allowed, did you mean '=='?"
          );
        }
        this.emitToken(TokenType.EQUAL_EQUAL);
        break;
      case '<':
        this.emitToken(this.match('=') ? TokenType.LESS_EQUAL : TokenType.LESS);
        break;
      case '>':
        this.emitToken(
          this.match('=') ? TokenType.GREATER_EQUAL : TokenType.GREATER
        );
        break;
      case '|':
        if (!this.match('|')) {
          throw this.errorOnPosition(
            "Single '|' is not allowed, did you mean '||'?"
          );
        }
        this.emitToken(TokenType.PIPE_PIPE);
        break;
      case '&':
        if (!this.match('&')) {
          throw this.errorOnPosition(
            "Single '&' is not allowed, did you mean '&&'?"
          );
        }
        this.emitToken(TokenType.AMPERSAND_AMPERSAND);
        break;
      case "'":
        this.handleString();
        break;
      case ' ':
      case '\r':
      case '\t':
      case '\n':
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

  /**
   * Should the lexer come to a single quote char, it interprets as a string the next symbols until the next quote.
   * @private
   */
  private handleString() {
    // ignore symbols until we find the matching quote
    while (this.peek() !== "'" && !this.isAtEnd()) {
      this.advance();
    }
    if (this.isAtEnd()) {
      throw this.errorOnPosition('Unterminated string', this.start);
    }
    // we are on the enclosing quote, so go to the next symbol
    this.advance();
    const begin = this.start + 1;
    const end = this.current - 1;
    this.emitToken(
      TokenType.STRING,
      this.source.substring(begin, end),
      begin,
      end,
      this.start
    );
  }

  /**
   * Scans a number token.
   * @private
   */
  private handleNumber() {
    while (Lexer.isDigit(this.peek())) {
      this.advance();
    }
    // for non-integer values, look for the dot separator
    if (this.peek() == '.' && Lexer.isDigit(this.peekNext())) {
      this.advance();
      while (Lexer.isDigit(this.peek())) {
        this.advance();
      }
    }
    const number: string = this.source.substring(this.start, this.current);
    this.emitToken(TokenType.NUMBER, Number.parseFloat(number));
  }

  /**
   * Scans an identifier token.
   * @private
   */
  private handleIdentifier() {
    while (Lexer.isAlphaNumeric(this.peek())) {
      this.advance();
    }
    let identifier = this.source.substring(this.start, this.current).toUpperCase();
    let type = Lexer.keywords[identifier];
    if (!type) {
      type = TokenType.IDENTIFIER;
    }
    this.emitToken(type, type === TokenType.ALWAYS ? true : null);
  }

  /**
   * Checks if the lexer is done scanning.
   * @private
   */
  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  /**
   * Consume the current symbol.
   * @private
   */
  private advance(): string {
    return this.source.charAt(this.current++);
  }

  /**
   * Consume the current symbol if it matches a given character, else return false.
   * @param expected expected character
   * @private
   */
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

  /**
   * Returns the current symbol.
   * @private
   */
  private peek(): string {
    if (this.isAtEnd()) {
      return '\0';
    }
    return this.source.charAt(this.current);
  }

  /**
   * Returns the symbol after the current symbol.
   * @private
   */
  private peekNext(): string {
    if (this.current + 1 >= this.source.length) {
      return '\0';
    }
    return this.source.charAt(this.current + 1);
  }

  /**
   * Push a new token to the output list.
   *
   * @param type token type
   * @param literal token value
   * @param begin start index in source
   * @param end end index in source
   * @param position position in source (may be different from begin)
   * @private
   */
  private emitToken(
    type: TokenType,
    literal: any = null,
    begin: number = this.start,
    end: number = this.current,
    position: number = begin
  ) {
    this.tokens.push(
      new Token(
        type,
        this.source.substring(begin, end),
        literal,
        position + this.offset
      )
    );
  }

  /**
   * Prints an error message to the console, then throws an error.
   *
   * @param message error message
   * @param position position in source where the error occurred
   * @private
   */
  private errorOnPosition(
    message: string,
    position: number = this.current - 1
  ): Error {
    Log.reportError('Syntax', this.source, message, position + this.offset);
    return Error();
  }
}
