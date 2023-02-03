/**
 * All possible words of the dsl.
 */
export enum TokenType {
  // single character tokens
  PARENTHESIS_OPEN,
  PARENTHESIS_CLOSE,
  PLUS,
  MINUS,
  COMMA,
  DOT,
  COLON,
  SLASH,
  STAR,
  PERCENT,
  DOLLAR,
  HASH,

  // single or double character tokens
  EXCLAMATION_MARK,
  EXCLAMATION_MARK_EQUAL,
  EQUAL_EQUAL,
  GREATER,
  GREATER_EQUAL,
  LESS,
  LESS_EQUAL,
  PIPE_PIPE,
  AMPERSAND_AMPERSAND,

  // literals
  IDENTIFIER,
  STRING,
  NUMBER,

  // keywords
  ALWAYS,
  WHEN,
  THEN,
  IF,
  AND,
  OR,
  NOT,

  // other
  EOF,
}

/**
 * Represents a word of the dsl.
 */
export default class Token {
  readonly type: TokenType;
  readonly lexeme: string;
  readonly literal: any;
  readonly position: number;

  /**
   * Creates a new token from data.
   *
   * @param type token type
   * @param lexeme token source
   * @param literal token value
   * @param position token position
   */
  constructor(type: TokenType, lexeme: string, literal: any, position: number) {
    this.type = type;
    this.lexeme = lexeme;
    this.literal = literal;
    this.position = position;
  }

  /**
   * Returns the string representation of this token.
   */
  toString(): string {
    return '([' + TokenType[this.type] + '] ' + "'" + this.lexeme + "'" + ')';
  }
}
