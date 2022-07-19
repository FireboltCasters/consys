import {Expression} from "../dsl/Expression";
import Lexer from "../dsl/Lexer";
import Parser from "../dsl/Parser";

class ASTPrinter implements Expression.Visitor<string> {

    print(expression: Expression.Expression | null) {
        return expression?.accept(this) || "";
    }

    visitBinaryExpression(expression: Expression.Binary): string {
        return this.parenthesize(expression.operator.lexeme, expression.left, expression.right);
    }

    visitGroupingExpression(expression: Expression.Grouping): string {
        return this.parenthesize("group", expression.expression);
    }

    visitLiteralExpression(expression: Expression.Literal): string {
        return expression.value.toString();
    }

    visitUnaryExpression(expression: Expression.Unary): string {
        return this.parenthesize(expression.operator.lexeme, expression.right);
    }

    private parenthesize(name: string, ...expressions: Expression.Expression[]) {
        return `(${name} ${expressions.map((e) => e.accept(this)).join(" ")})`;
    }

    visitConstraintExpression(rule: Expression.Constraint): string {
        return `(activation ${rule.activation.accept(this)} assertion ${rule.assertion.accept(this)})`;
    }

    visitFunctionExpression(rule: Expression.Function): string {
        return this.parenthesize(rule.name.lexeme, ...rule.args);
    }

    visitVariableExpression(rule: Expression.Variable): string {
        return `${rule.type.lexeme} ${rule.name.map((e) => e.lexeme).join(".")}`;
    }
}

const parseFromSource: (source: string) => Expression.Expression | null = (source: string) => {
    const lexer = new Lexer(source);
    const tokens = lexer.scan();
    const parser = new Parser(source, tokens);
    return parser.parse();
};

test("Parser throws error when syntax is not 'activation : assertion'", () => {
    expect(() => parseFromSource('')).toThrowError();
    expect(() => parseFromSource(':')).toThrowError();
    expect(() => parseFromSource('::')).toThrowError();
    expect(() => parseFromSource(':::')).toThrowError();
    expect(() => parseFromSource('ALWAYS:')).toThrowError();
    expect(() => parseFromSource(':TRUE')).toThrowError();
    expect(() => parseFromSource('1:1')).toThrowError();
});

test('Parser throws error on unexpected tokens', () => {
    expect(() => parseFromSource('WHEN WHEN : 1 < 3')).toThrowError();
    expect(() => parseFromSource('WHEN 1 < 3 : WHEN')).toThrowError();
    expect(() => parseFromSource('ALWAYS ALWAYS : 1 < 3')).toThrowError();
    expect(() => parseFromSource('ALWAYS 1 < 3 : ALWAYS')).toThrowError();
    expect(() => parseFromSource('1 < 3 : 1 < 3')).toThrowError();
    expect(() => parseFromSource('ALWAYS : 1 < 3 < 5')).toThrowError();
    expect(() => parseFromSource('ALWAYS : 1 < 3 5')).toThrowError();
    expect(() => parseFromSource('ALWAYS : 1 3 < 5')).toThrowError();
    expect(() => parseFromSource('ALWAYS : 1 3')).toThrowError();
    expect(() => parseFromSource('ALWAYS : #a$b')).toThrowError();
    expect(() => parseFromSource('WHEN #a#b : 1 < 3')).toThrowError();
    expect(() => parseFromSource('ALWAYS : 1 <> 3')).toThrowError();
    expect(() => parseFromSource('ALWAYS : 1 < 3 <')).toThrowError();
    expect(() => parseFromSource('ALWAYS : 1 <')).toThrowError();
    expect(() => parseFromSource('ALWAYS : 2 < 4.')).toThrowError();
});

test('Parser does not throw error from valid syntax', () => {
    expect(!!parseFromSource('ALWAYS : TRUE')).toBe(true);
    expect(!!parseFromSource('WHEN TRUE : TRUE')).toBe(true);
    expect(!!parseFromSource('TRUE : TRUE')).toBe(true);
    expect(!!parseFromSource('ALWAYS : A < $B + #C')).toBe(true);
    expect(!!parseFromSource('ALWAYS : A <= $B - #C || D')).toBe(true);
    expect(!!parseFromSource('ALWAYS : A == $B * #C OR D AND E')).toBe(true);
    expect(!!parseFromSource('ALWAYS : A != $B / #C OR D && E')).toBe(true);
    expect(!!parseFromSource('ALWAYS : A >= $B / #C OR D && E % F > G')).toBe(true);
    expect(!!parseFromSource('ALWAYS : -A >= ($B / #C) OR D && NOT E % F > !G')).toBe(true);
});

test('Parser generates valid AST from valid syntax', () => {
    const ast = parseFromSource('ALWAYS : -A >= ($B / #C) OR D && NOT E % F > !G');
    const printer = new ASTPrinter();
    const astString = printer.print(ast);
    const expected = "(activation ([ALWAYS] 'ALWAYS') " +
        "assertion (OR (>= (- (A )) (group (/ $ B # C))) (&& (D ) (> (% (NOT (E )) (F )) (! (G ))))))";
    expect(astString).toBe(expected);
});
