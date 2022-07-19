import Token, {TokenType} from "./Token";
import {Expression} from "./Expression";
import {Log} from "../Util";

/**
 * Syntax definition for constraints.
 *
 * constraint      ->  activation ":" assertion ;
 * activation      ->  "ALWAYS" | "WHEN" expression | functionExpr ;
 * assertion       ->  expression ;
 *
 * expression      ->  disjunction ;
 * disjunction     ->  conjunction ( ( "||" | "OR" ) conjunction )* ;
 * conjunction     ->  equality ( ( "&&" | "AND" ) equality )* ;
 * equality        ->  comparison ( ( "==" | "!=" ) comparison )? ;
 * comparison      ->  term ( ( "<" | "<=" | ">=" | ">" ) term )? ;
 * term            ->  factor ( ( "+" | "-" ) factor )* ;
 * factor          ->  unary ( ( "*" | "/" | "%" ) unary )* ;
 * unary           ->  ( "!" | "-" | "NOT" ) unary | primary ;
 * primary         ->  number | string | variable | function | "(" expression ")" ;
 *
 * variable        ->  model | state ;
 * model           ->  "$" ( nested )? ;
 * state           ->  "#" ( nested )? ;
 * nested          ->  identifier ( "." identifier )* ;
 *
 * function        ->  functionExpr | identifier "(" ( arguments )? ")" ;
 * arguments       ->  expression ( "," expression )* ;
 * functionExpr    ->  identifier ;
 *
 * number          ->  natural ( digit )* ( "." ( digit )+ )? ;
 * string          ->  "'" ( character )* "'" ;
 * identifier      ->  alpha ( alpha | digit | "_" )* ;
 *
 * digit           ->  zero | natural ;
 * character       ->  digit | alpha ;
 * zero            ->  "0" ;
 * natural         ->  "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" ;
 * alpha           ->  "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" |
 *                     "J" | "K" | "L" | "M" | "N" | "O" | "P" | "Q" | "R" |
 *                     "S" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z" | "a" |
 *                     "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" |
 *                     "k" | "l" | "m" | "n" | "o" | "p" | "q" | "r" | "s" |
 *                     "t" | "u" | "v" | "w" | "x" | "y" | "z" ;
 */
export default class Parser {

    private readonly source: string;
    private readonly tokens: Token[];
    private current: number = 0;

    constructor(source: string, tokens: Token[]) {
        this.source = source;
        this.tokens = tokens;
    }

    parse(): Expression.Expression | null {
        if (this.tokens.length === 1) {
            throw this.syntaxErrorOnToken(this.peek(), `Expected constraint`);
        }
        return this.constraint();
    }

    private constraint(): Expression.Expression {
        let activation = this.activation();
        this.consume(TokenType.COLON, "Expected ':' after activation");
        let assertion = this.assertion();
        if (!this.isAtEnd()) {
            let token = this.peek();
            throw this.syntaxErrorOnToken(token, `Unexpected token '${token.lexeme}'`);
        }
        this.advance();
        return new Expression.Constraint(activation, assertion);
    }

    private activation(): Expression.Expression {
        if (this.matchAny(TokenType.ALWAYS, TokenType.WHEN)) {
            let operator = this.previous();
            if (operator.type === TokenType.ALWAYS) {
                return new Expression.Literal(operator);
            }
            return this.expression();
        }
        if (!this.check(TokenType.IDENTIFIER)) {
            throw this.syntaxErrorOnToken(this.peek(), "Expected activation");
        }
        return this.functionExpr();
    }

    private assertion(): Expression.Expression {
        return this.expression();
    }

    private expression(): Expression.Expression {
        return this.disjunction();
    }

    private disjunction(): Expression.Expression {
        return this.parseLeftAssociativeBinaryOperator(
            () => this.conjunction(),
            TokenType.PIPE_PIPE, TokenType.OR
        );
    }

    private conjunction(): Expression.Expression {
        return this.parseLeftAssociativeBinaryOperator(
            () => this.equality(),
            TokenType.AMPERSAND_AMPERSAND, TokenType.AND
        );
    }

    private equality(): Expression.Expression {
        return this.parseLeftAssociativeOptionalBinaryOperator(
            () => this.comparison(),
            TokenType.EQUAL_EQUAL, TokenType.EXCLAMATION_MARK_EQUAL
        );
    }

    private comparison(): Expression.Expression {
        return this.parseLeftAssociativeOptionalBinaryOperator(
            () => this.term(),
            TokenType.LESS, TokenType.LESS_EQUAL, TokenType.GREATER_EQUAL, TokenType.GREATER
        );
    }

    private term(): Expression.Expression {
        return this.parseLeftAssociativeBinaryOperator(
            () => this.factor(),
            TokenType.PLUS, TokenType.MINUS
        );
    }

    private factor(): Expression.Expression {
        return this.parseLeftAssociativeBinaryOperator(
            () => this.unary(),
            TokenType.STAR, TokenType.SLASH, TokenType.PERCENT
        );
    }

    private unary(): Expression.Expression {
        if (this.matchAny(TokenType.EXCLAMATION_MARK, TokenType.MINUS, TokenType.NOT)) {
            let operator = this.previous();
            let right = this.unary();
            return new Expression.Unary(operator, right);
        }
        return this.primary();
    }

    private primary(): Expression.Expression {
        if (this.matchAny(TokenType.IDENTIFIER)) {
            return this.functionCall();
        }
        if (this.matchAny(TokenType.DOLLAR, TokenType.HASH)) {
            return this.variable();
        }
        if (this.matchAny(TokenType.NUMBER, TokenType.STRING)) {
            return new Expression.Literal(this.previous());
        }
        if (this.matchAny(TokenType.PARENTHESIS_OPEN)) {
            let expression = this.expression();
            this.consume(TokenType.PARENTHESIS_CLOSE, "Expected ')' after expression");
            return new Expression.Grouping(expression);
        }
        throw this.syntaxErrorOnToken(this.peek(), "Expected expression");
    }

    private variable(): Expression.Expression {
        let type = this.previous();
        let name: Token[] = [];
        if (this.matchAny(TokenType.IDENTIFIER)) {
            name.push(this.previous());
            while (this.matchAny(TokenType.DOT)) {
                let identifier = this.consume(TokenType.IDENTIFIER, "Expected identifier");
                name.push(identifier);
            }
        }
        return new Expression.Variable(type, name);
    }

    private identifier(): Expression.Expression {
        let value = this.advance();
        return new Expression.Literal(value);
    }

    private functionCall(): Expression.Expression {
        let name = this.previous();
        let args: Expression.Expression[] = [];
        if (this.matchAny(TokenType.PARENTHESIS_OPEN)) {
            args = this.args();
            this.consume(TokenType.PARENTHESIS_CLOSE, "Expected ')' after arguments");
        }
        return new Expression.Function(name, args);
    }

    private args(): Expression.Expression[] {
        let args: Expression.Expression[] = [];
        if (this.check(TokenType.PARENTHESIS_CLOSE)) {
            return args;
        }
        args.push(this.expression());
        while (this.matchAny(TokenType.COMMA)) {
            args.push(this.expression());
        }
        return args;
    }

    private functionExpr(): Expression.Expression {
        return this.identifier();
    }

    private parseLeftAssociativeBinaryOperator(
        production: () => Expression.Expression,
        ...operators: TokenType[]
    ): Expression.Expression {
        let expression = production();
        while (this.matchAny(...operators)) {
            let operator = this.previous();
            let right = production();
            expression = new Expression.Binary(expression, operator, right);
        }
        return expression;
    }

    private parseLeftAssociativeOptionalBinaryOperator(
        production: () => Expression.Expression,
        ...operators: TokenType[]
    ): Expression.Expression {
        let expression = production();
        if (this.matchAny(...operators)) {
            let operator = this.previous();
            let right = production();
            expression = new Expression.Binary(expression, operator, right);
        }
        return expression;
    }

    private matchAny(...types: TokenType[]): boolean {
        for (let type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }

    private consume(type: TokenType, message: string): Token {
        if (this.check(type)) {
            return this.advance();
        }
        throw this.syntaxErrorOnToken(this.peek(), message);
    }

    private check(type: TokenType): boolean {
        if (this.isAtEnd()) {
            return false;
        }
        return this.peek().type === type;
    }

    private advance(): Token {
        if (!this.isAtEnd()) {
            this.current++;
        }
        return this.previous();
    }

    private isAtEnd(): boolean {
        return this.peek().type === TokenType.EOF;
    }

    private peek(): Token {
        return this.tokens[this.current];
    }

    private previous(): Token {
        return this.tokens[this.current - 1];
    }

    private syntaxErrorOnToken(token: Token, message: string): Error {
        Log.reportSyntaxError(this.source, message, token.position);
        return Error();
    }
}
