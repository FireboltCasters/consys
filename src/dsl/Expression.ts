import Token from "./Token";

export namespace Expression {

    export interface Visitor<T> {
        visitBinaryExpression(expression: Expression.Binary): T;
        visitConstraintExpression(expression: Expression.Constraint): T;
        visitFunctionExpression(expression: Expression.Function): T;
        visitGroupingExpression(expression: Expression.Grouping): T;
        visitLiteralExpression(expression: Expression.Literal): T;
        visitUnaryExpression(expression: Expression.Unary): T;
        visitVariableExpression(expression: Expression.Variable): T;
    }

    export interface Expression {
        accept<T>(visitor: Visitor<T>): T;
    }

    export class Binary implements Expression {

        readonly left: Expression;
        readonly operator: Token;
        readonly right: Expression;

        constructor(left: Expression, operator: Token, right: Expression) {
            this.left = left;
            this.operator = operator;
            this.right = right;
        }

        accept<T>(visitor: Expression.Visitor<T>): T {
            return visitor.visitBinaryExpression(this);
        }
    }

    export class Constraint implements Expression {

        readonly activation: Expression;
        readonly assertion: Expression;

        constructor(activation: Expression, assertion: Expression) {
            this.activation = activation;
            this.assertion = assertion;
        }

        accept<T>(visitor: Expression.Visitor<T>): T {
            return visitor.visitConstraintExpression(this);
        }
    }

    export class Function implements Expression {

        readonly name: Token;
        readonly args: Expression[];

        constructor(name: Token, args: Expression[]) {
            this.name = name;
            this.args = args;
        }

        accept<T>(visitor: Expression.Visitor<T>): T {
            return visitor.visitFunctionExpression(this);
        }
    }

    export class Grouping implements Expression {

        readonly expression: Expression;

        constructor(expression: Expression) {
            this.expression = expression;
        }

        accept<T>(visitor: Expression.Visitor<T>): T {
            return visitor.visitGroupingExpression(this);
        }
    }

    export class Literal implements Expression {

        readonly value: Token;

        constructor(value: Token) {
            this.value = value;
        }

        accept<T>(visitor: Expression.Visitor<T>): T {
            return visitor.visitLiteralExpression(this);
        }
    }

    export class Unary implements Expression {

        readonly operator: Token;
        readonly right: Expression;

        constructor(operator: Token, right: Expression) {
            this.operator = operator;
            this.right = right;
        }

        accept<T>(visitor: Expression.Visitor<T>): T {
            return visitor.visitUnaryExpression(this);
        }
    }

    export class Variable implements Expression {

        readonly type: Token;
        readonly name: Token[];

        constructor(type: Token, name: Token[]) {
            this.type = type;
            this.name = name;
        }

        accept<T>(visitor: Expression.Visitor<T>): T {
            return visitor.visitVariableExpression(this);
        }
    }
}
