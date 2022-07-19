import {Expression} from "./Expression";
import {TokenType} from "./Token";

export default class Emitter implements Expression.Visitor<string> {

    private readonly ast: Expression.Expression | null;

    constructor(ast: Expression.Expression | null) {
        this.ast = ast;
    }

    emit(): string {
        return this.ast?.accept(this) || "";
    }

    visitBinaryExpression(rule: Expression.Binary): string {
        let left = rule.left.accept(this);
        let right = rule.right.accept(this);
        let operator: string = `${rule.operator.lexeme}`;
        switch (rule.operator.type) {
            case TokenType.OR:
                operator = `||`;
                break;
            case TokenType.AND:
                operator = `&&`;
                break;
        }
        return `${left}${operator}${right}`;
    }

    visitConstraintExpression(rule: Expression.Constraint): string {
        let activation = rule.activation.accept(this);
        let assertion = rule.assertion.accept(this);
        return `if(${activation}){return(${assertion});}else{return(true);}`;
    }

    visitFunctionExpression(rule: Expression.Function): string {
        let args: string = `this.model,this.state`;
        if (rule.args.length > 0) {
            args = rule.args.map((rule: Expression.Expression) => rule.accept(this)).join(`,`);
        }
        return `this.functions['${rule.name.lexeme}'](${args})`;
    }

    visitGroupingExpression(rule: Expression.Grouping): string {
        return `(${rule.expression.accept(this)})`;
    }

    visitLiteralExpression(rule: Expression.Literal): string {
        switch (rule.value.type) {
            case TokenType.STRING:
                return `'${rule.value.lexeme}'`;
            case TokenType.NUMBER:
                return `${rule.value.lexeme}`;
            case TokenType.ALWAYS:
                return `true`;
        }
        return `this.functions['${rule.value.lexeme}'](this.model,this.state)`;
    }

    visitUnaryExpression(rule: Expression.Unary): string {
        let expression = rule.right.accept(this);
        let operator = `${rule.operator.lexeme}`;
        if (rule.operator.type === TokenType.NOT) {
            operator = `!`;
        }
        return `${operator}${expression}`;
    }

    visitVariableExpression(rule: Expression.Variable): string {
        let variable = `this.model`;
        if (rule.type.type === TokenType.HASH) {
            variable = `this.state`;
        }
        for (let identifier of rule.name) {
            variable += `.${identifier.lexeme}`;
        }
        return variable;
    }
}
