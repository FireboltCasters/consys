import Token, {TokenType} from "./Token";
import {Expression} from "./Expression";
import {Log} from "../Util";

/**
 * This class transforms a given list of tokens into an abstract syntax tree mirroring the dsl grammar.
 * Syntax definition for constraints:
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

    // parser state
    private readonly source: string;
    private readonly tokens: Token[];
    private current: number = 0;

    // statistics used to evaluate the generated constraint
    private statistics: Expression.Statistics = {
        counts: {
            model: {},
            state: {}
        }
    };

    /**
     * Creates a new parser instance from a given string of source code and a list of tokens.
     *
     * @param source source code
     * @param tokens list of tokens
     */
    constructor(source: string, tokens: Token[]) {
        this.source = source;
        this.tokens = tokens;
    }

    /**
     * Returns the ast for the given token list for a constraint.
     */
    parse(): Expression.AST {
        return this.run(() => this.constraint(), `Expected constraint`);
    }

    /**
     * Returns the ast for the given token list for a model.
     */
    parseModel(): Expression.AST {
        return this.run(() => {
            this.advance();
            return this.variable();
        }, `Expected model`);
    }

    /**
     * Returns the ast for the given token list for a state.
     */
    parseState(): Expression.AST {
        return this.run(() => {
            this.advance();
            return this.variable();
        }, `Expected state`);
    }

    /**
     * Returns the ast for the given token list for a function.
     */
    parseFunction(): Expression.AST {
        return this.run(() => {
            this.advance();
            return this.functionCall();
        }, `Expected function`);
    }

    /**
     * Returns the ast for the given token list for a function expression.
     */
    parseFunctionExpr(): Expression.AST {
        return this.run(() => {
            this.advance();
            return this.functionExpr();
        }, `Expected function expression`);
    }

    /**
     * Starts the parsing algorithm with a given starting rule.
     *
     * @param start starting rule
     * @param emptyMessage error message if an empty list is given (single eof token)
     * @private
     */
    private run(start: () => Expression.Expression, emptyMessage: string): Expression.AST {
        if (this.tokens.length === 1) {
            throw this.syntaxErrorOnToken(this.peek(), emptyMessage);
        }
        const root = start();
        return new Expression.AST(root, this.source, this.statistics);
    }

    /**
     * Matches this rule:
     * constraint      ->  activation ":" assertion ;
     * @private
     */
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

    /**
     * Matches this rule:
     * activation      ->  "ALWAYS" | "WHEN" expression | functionExpr ;
     * @private
     */
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

    /**
     * Matches this rule:
     * assertion       ->  expression ;
     * @private
     */
    private assertion(): Expression.Expression {
        return this.expression();
    }

    /**
     * Matches this rule:
     * expression      ->  disjunction ;
     * @private
     */
    private expression(): Expression.Expression {
        return this.disjunction();
    }

    /**
     * Matches this rule:
     * disjunction     ->  conjunction ( ( "||" | "OR" ) conjunction )* ;
     * @private
     */
    private disjunction(): Expression.Expression {
        return this.parseLeftAssociativeBinaryOperator(
            true,
            () => this.conjunction(),
            TokenType.PIPE_PIPE, TokenType.OR
        );
    }

    /**
     * Matches this rule:
     * conjunction     ->  equality ( ( "&&" | "AND" ) equality )* ;
     * @private
     */
    private conjunction(): Expression.Expression {
        return this.parseLeftAssociativeBinaryOperator(
            true,
            () => this.equality(),
            TokenType.AMPERSAND_AMPERSAND, TokenType.AND
        );
    }

    /**
     * Matches this rule:
     * equality        ->  comparison ( ( "==" | "!=" ) comparison )? ;
     * @private
     */
    private equality(): Expression.Expression {
        return this.parseLeftAssociativeOptionalBinaryOperator(
            () => this.comparison(),
            TokenType.EQUAL_EQUAL, TokenType.EXCLAMATION_MARK_EQUAL
        );
    }

    /**
     * Matches this rule:
     * comparison      ->  term ( ( "<" | "<=" | ">=" | ">" ) term )? ;
     * @private
     */
    private comparison(): Expression.Expression {
        return this.parseLeftAssociativeOptionalBinaryOperator(
            () => this.term(),
            TokenType.LESS, TokenType.LESS_EQUAL, TokenType.GREATER_EQUAL, TokenType.GREATER
        );
    }

    /**
     * Matches this rule:
     * term            ->  factor ( ( "+" | "-" ) factor )* ;
     * @private
     */
    private term(): Expression.Expression {
        return this.parseLeftAssociativeBinaryOperator(
            false,
            () => this.factor(),
            TokenType.PLUS, TokenType.MINUS
        );
    }

    /**
     * Matches this rule:
     * factor          ->  unary ( ( "*" | "/" | "%" ) unary )* ;
     * @private
     */
    private factor(): Expression.Expression {
        return this.parseLeftAssociativeBinaryOperator(
            false,
            () => this.unary(),
            TokenType.STAR, TokenType.SLASH, TokenType.PERCENT
        );
    }

    /**
     * Matches this rule:
     * unary           ->  ( "!" | "-" | "NOT" ) unary | primary ;
     * @private
     */
    private unary(): Expression.Expression {
        if (this.matchAny(TokenType.EXCLAMATION_MARK, TokenType.MINUS, TokenType.NOT)) {
            let operator = this.previous();
            let right = this.unary();
            return new Expression.Unary(operator, right);
        }
        return this.primary();
    }

    /**
     * Matches this rule:
     * primary         ->  number | string | variable | function | "(" expression ")" ;
     * @private
     */
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

    /**
     * Matches this rule:
     * variable        ->  model | state ;
     * model           ->  "$" ( nested )? ;
     * state           ->  "#" ( nested )? ;
     * nested          ->  identifier ( "." identifier )* ;
     * @private
     */
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
        this.addStatisticsVariable(type, name);
        return new Expression.Variable(type, name);
    }

    /**
     * Matches this rule:
     * function        ->  functionExpr | identifier "(" ( arguments )? ")" ;
     * @private
     */
    private functionCall(): Expression.Expression {
        const name = this.previous();
        let args: Expression.Expression[] = [];
        if (this.matchAny(TokenType.PARENTHESIS_OPEN)) {
            args = this.args();
            this.consume(TokenType.PARENTHESIS_CLOSE, "Expected ')' after arguments");
        }
        return new Expression.Function(name, args);
    }

    /**
     * Matches this rule:
     * arguments       ->  expression ( "," expression )* ;
     * @private
     */
    private args(): Expression.Expression[] {
        const args: Expression.Expression[] = [];
        if (this.check(TokenType.PARENTHESIS_CLOSE)) {
            return args;
        }
        args.push(this.expression());
        while (this.matchAny(TokenType.COMMA)) {
            args.push(this.expression());
        }
        return args;
    }

    /**
     * Matches this rule:
     * functionExpr    ->  identifier ;
     * @private
     */
    private functionExpr(): Expression.Expression {
        const name = this.advance();
        return new Expression.Function(name, []);
    }

    /**
     * Parses a rule with the following format:
     * rule     ->  production ( ( operators[0] | operators[1] | ... ) production )* ;
     *
     * @param logical true if currently parsing a logical expression
     * @param production production function pointer
     * @param operators binary operators of this rule
     * @private
     */
    private parseLeftAssociativeBinaryOperator(
        logical: boolean,
        production: () => Expression.Expression,
        ...operators: TokenType[]
    ): Expression.Expression {
        let expression = production();
        while (this.matchAny(...operators)) {
            let operator = this.previous();
            let right = production();
            if (logical) {
                expression = new Expression.Logical(expression, operator, right);
            } else {
                expression = new Expression.Binary(expression, operator, right);
            }
        }
        return expression;
    }

    /**
     * Parses a rule with the following format:
     * rule     ->  production ( ( operators[0] | operators[1] | ... ) production )? ;
     *
     * @param production production function pointer
     * @param operators binary operators of this rule
     * @private
     */
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

    /**
     * Adds a variable of given type (model or state) to the statistics counts.
     *
     * @param type variable type
     * @param name variable name
     * @private
     */
    private addStatisticsVariable(type: Token, name: Token[]) {
        if (name.length === 0) {
            return;
        }
        const identifierString = name.map((token) => token.lexeme).join(".");
        if (type.type === TokenType.DOLLAR) {
            if (!this.statistics.counts.model[identifierString]) {
                this.statistics.counts.model[identifierString] = 0;
            }
            this.statistics.counts.model[identifierString]++;
        } else {
            if (!this.statistics.counts.state[identifierString]) {
                this.statistics.counts.state[identifierString] = 0;
            }
            this.statistics.counts.state[identifierString]++;
        }
    }

    /**
     * Consumes the current token if any of the given token types matches the current token.
     *
     * @param types token types to match
     * @private
     */
    private matchAny(...types: TokenType[]): boolean {
        for (let type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }

    /**
     * Consumes the current token.
     *
     * @param type token type
     * @param message error message if current token is not of given type
     * @private
     */
    private consume(type: TokenType, message: string): Token {
        if (this.check(type)) {
            return this.advance();
        }
        throw this.syntaxErrorOnToken(this.peek(), message);
    }

    /**
     * Check if the current token is of the given type.
     *
     * @param type token type to check
     * @private
     */
    private check(type: TokenType): boolean {
        if (this.isAtEnd()) {
            return false;
        }
        return this.peek().type === type;
    }

    /**
     * Consumes the current token.
     * @private
     */
    private advance(): Token {
        if (!this.isAtEnd()) {
            this.current++;
        }
        return this.previous();
    }

    /**
     * Checks if the parser is done.
     * @private
     */
    private isAtEnd(): boolean {
        return this.peek().type === TokenType.EOF;
    }

    /**
     * Returns the current token.
     * @private
     */
    private peek(): Token {
        return this.tokens[this.current];
    }

    /**
     * Returns the previous token.
     * @private
     */
    private previous(): Token {
        return this.tokens[this.current - 1];
    }

    /**
     * Prints an error message and then throws an error.
     *
     * @param token token where the error occurred
     * @param message error message
     * @private
     */
    private syntaxErrorOnToken(token: Token, message: string): Error {
        Log.reportError("Syntax", this.source, message, token.position);
        return Error();
    }
}
