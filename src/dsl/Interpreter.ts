import {Expression} from "./Expression";
import {TokenType} from "./Token";
import {Log} from "../Util";


export default class Interpreter<M, S> implements Expression.Visitor<any> {

    // store the current model, state and registered functions for evaluation
    private model: M | null                                 = null;
    private state: S | null                                 = null;
    private source: string | null                           = null;
    private functions: {[name: string]: Function} | null    = null;

    interpret(ast: Expression.AST, model: M, state: S, functions: {[name: string]: Function}): any {
        this.model = model;
        this.state = state;
        this.source = ast.source;
        this.functions = functions;
        return ast.root?.accept(this);
    }

    visitBinaryExpression(expression: Expression.Binary): any {
        const left = expression.left.accept(this);
        const right = expression.right.accept(this);
        switch (expression.operator.type) {
            case TokenType.PLUS:
                return left + right;
            case TokenType.MINUS:
                return left - right;
            case TokenType.STAR:
                return left * right;
            case TokenType.SLASH:
                if (right === 0) {
                    this.reportError(`Division by zero`, expression.operator.position);
                    return false;
                }
                return left / right;
            case TokenType.PERCENT:
                if (right === 0) {
                    this.reportError(`Division by zero`, expression.operator.position);
                    return false;
                }
                return left % right;
            case TokenType.EXCLAMATION_MARK_EQUAL:
                return left != right;
            case TokenType.EQUAL_EQUAL:
                return left == right;
            case TokenType.GREATER:
                return left > right;
            case TokenType.GREATER_EQUAL:
                return left >= right;
            case TokenType.LESS:
                return left < right;
            case TokenType.LESS_EQUAL:
                return left <= right;
        }
        // unreachable
        return false;
    }

    visitConstraintExpression(expression: Expression.Constraint): any {
        const activation = expression.activation.accept(this);
        if (activation) {
            return expression.assertion.accept(this);
        }
        return true;
    }

    visitFunctionExpression(expression: Expression.Function): any {
        let name = expression.name.lexeme;
        if (!this.functions || !!this.functions && this.functions[name] === undefined) {
            this.reportError(`Function '${name}' is not registered`, expression.name.position);
            return false;
        }
        let args: any[];
        if (expression.args.length === 0) {
            args = [this.model, this.state];
        } else {
            args = expression.args.map((arg) => arg.accept(this));
        }
        return this.functions[name](...args);
    }

    visitGroupingExpression(expression: Expression.Grouping): any {
        return expression.expression.accept(this);
    }

    visitLiteralExpression(expression: Expression.Literal): any {
        return expression.value.literal;
    }

    visitLogicalExpression(expression: Expression.Logical): any {
        const left = expression.left.accept(this);
        if (expression.operator.type === TokenType.PIPE_PIPE || expression.operator.type === TokenType.OR) {
            if (!!left) {
                return left;
            }
        } else {
            if (!left) {
                return left;
            }
        }
        return expression.right.accept(this);
    }

    visitUnaryExpression(expression: Expression.Unary): any {
        const right = expression.right.accept(this);
        if (expression.operator.type === TokenType.MINUS) {
            return -right;
        }
        return !right;
    }

    visitVariableExpression(expression: Expression.Variable): any {
        let value: any = this.model;
        if (expression.type.type === TokenType.HASH) {
            value = this.state;
        }
        if (expression.name.length === 0) {
            return JSON.stringify(value);
        }
        for (let name of expression.name) {
            try {
                value = value[name.lexeme];
            } catch (error) {
                const type = expression.type.type === TokenType.HASH ? "state" : "model";
                const position = name.position;
                this.reportError(`Given ${type} has no attribute '${name.lexeme}'`, position);
                return false;
            }
        }
        return value;
    }

    private reportError(message: string, position: number) {
        Log.reportError("Runtime", this.source || "", message, position);
    }
}
