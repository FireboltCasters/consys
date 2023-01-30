import {Expression} from './Expression';
import Interpreter from './Interpreter';
import Lexer from './Lexer';
import Parser from './Parser';

enum TextTokenType {
  MODEL,
  STATE,
  FUNCTION,
  FUNCTION_EXPR,
}

type TextToken<M, S> = {
  lexeme: string;
  position: number;
  type: TextTokenType;
  ast: Expression.AST;
};

export default class TextProcessor<M, S> {
  private readonly interpreter: Interpreter<M, S> = new Interpreter();
  private readonly source: string = '';
  private functions: {[name: string]: Function} = {};
  private textTokens: TextToken<M, S>[] = [];
  private current: number = 0;
  private start: number = 0;

  constructor(source: string, functions: {[name: string]: Function} = {}) {
    this.source = source;
    this.functions = functions;
    this.scan();
  }

  process(
    model: M,
    state: S,
    functions: {[name: string]: Function} = {},
    rescan: boolean = true
  ): string {
    if (this.source === '') {
      return '';
    }
    if (rescan) {
      this.functions = functions;
      this.scan();
    }
    if (this.textTokens.length === 0) {
      return this.source;
    }
    let res = this.source + '';
    // iterate backwards so the positions do not change for the other tokens
    for (let i = this.textTokens.length - 1; i >= 0; i--) {
      const token = this.textTokens[i];
      if (!!token.ast) {
        let value = this.interpreter.interpret(
          token.ast,
          model,
          state,
          this.functions
        );
        res =
          res.substring(0, token.position) +
          value +
          res.substring(token.position + token.lexeme.length);
      }
    }
    return res;
  }

  private scan() {
    this.current = 0;
    this.start = 0;
    this.textTokens = [];
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.scanToken();
    }
  }

  private scanToken() {
    const currentSymbol = this.advance();
    switch (currentSymbol) {
      case '$':
        this.scanVariable(TextTokenType.MODEL);
        break;
      case '#':
        this.scanVariable(TextTokenType.STATE);
        break;
      default:
        if (!!currentSymbol.match(/[a-zA-Z_]/)) {
          this.scanFunction();
        }
        break;
    }
  }

  private scanVariable(type: TextTokenType) {
    if (!!this.peek().match(/[a-zA-Z_]/)) {
      while (!this.isAtEnd()) {
        while (!!this.peek().match(/[a-zA-Z0-9_]/)) {
          this.advance();
        }
        if (this.peek() === '.' && this.peekNext().match(/[a-zA-Z_]/)) {
          this.advance();
        } else {
          break;
        }
      }
    }
    const lexeme = this.source.substring(this.start, this.current);
    this.addToken(lexeme, this.start, type);
  }

  private scanArguments() {
    let stackCount = 0;
    while (!this.isAtEnd()) {
      switch (this.peek()) {
        case '(':
          stackCount++;
          break;
        case ')':
          stackCount--;
          break;
      }
      if (stackCount === 0) {
        return;
      }
      this.advance();
    }
  }

  private scanFunction() {
    while (!!this.peek().match(/[a-zA-Z0-9_]/)) {
      this.advance();
    }
    const identifier = this.source.substring(this.start, this.current);
    // not a function
    if (!this.functions[identifier]) {
      return;
    }
    if (this.peek() === '(') {
      this.scanArguments();
      if (this.peek() === ')') {
        this.advance();
        const lexeme = this.source.substring(this.start, this.current);
        this.addToken(lexeme, this.start, TextTokenType.FUNCTION);
      }
      return;
    }
    this.addToken(identifier, this.start, TextTokenType.FUNCTION_EXPR);
  }

  private addToken(lexeme: string, position: number, type: TextTokenType) {
    this.textTokens.push({
      lexeme: lexeme,
      position: position,
      type: type,
      ast: this.generateAST(lexeme, position, type),
    });
  }

  private generateAST(
    text: string,
    offset: number,
    type: TextTokenType
  ): Expression.AST {
    const lexer = new Lexer(text, offset);
    const tokens = lexer.scan();
    const parser = new Parser(text, tokens);
    switch (type) {
      case TextTokenType.MODEL:
        return parser.parseModel();
      case TextTokenType.STATE:
        return parser.parseState();
      case TextTokenType.FUNCTION:
        return parser.parseFunction();
      case TextTokenType.FUNCTION_EXPR:
        return parser.parseFunctionExpr();
    }
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private advance(): string {
    return this.source.charAt(this.current++);
  }

  private peek(): string {
    if (this.isAtEnd()) {
      return '\0';
    }
    return this.source.charAt(this.current);
  }

  private peekNext(): string {
    if (this.current + 1 >= this.source.length) {
      return '\0';
    }
    return this.source.charAt(this.current + 1);
  }
}
