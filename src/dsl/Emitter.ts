import {Expression} from './Expression';
import {TokenType} from './Token';

export default class Emitter implements Expression.Visitor<string> {
  private readonly ast: Expression.AST;

  constructor(ast: Expression.AST) {
    this.ast = ast;
  }

  emit(): string {
    return this.ast.root?.accept(this) || '';
  }

  visitBinaryExpression(rule: Expression.Binary): string {
    return `${rule.left.accept(this)}${rule.operator.lexeme}${rule.right.accept(
      this
    )}`;
  }

  visitConstraintExpression(rule: Expression.Constraint): string {
    let activation = rule.activation.accept(this);
    let assertion = rule.assertion.accept(this);
    let assertFn = `function assert(e,n){if(!e){throw Error(n)}};`;
    let validInputCheck = ``;
    for (let modelVar of Object.keys(this.ast.statistics.counts.model)) {
      validInputCheck += `assert(this.model.${modelVar}!==undefined,"$${modelVar}");`;
    }
    for (let stateVar of Object.keys(this.ast.statistics.counts.state)) {
      validInputCheck += `assert(this.state.${stateVar}!==undefined,"#${stateVar}");`;
    }
    return `${assertFn}${validInputCheck}if(${activation}){return(${assertion});}else{return(true);}`;
  }

  visitFunctionExpression(rule: Expression.Function): string {
    let args: string = `this.model,this.state`;
    if (rule.args.length > 0) {
      args = rule.args
        .map((rule: Expression.Expression) => rule.accept(this))
        .join(`,`);
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
      default:
        return `true`;
    }
  }

  visitLogicalExpression(rule: Expression.Logical): string {
    let operator: string = `${rule.operator.lexeme}`;
    switch (rule.operator.type) {
      case TokenType.OR:
        operator = `||`;
        break;
      case TokenType.AND:
        operator = `&&`;
        break;
    }
    return `${rule.left.accept(this)}${operator}${rule.right.accept(this)}`;
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
        if (rule.prefix.type === TokenType.HASH) {
            variable = `this.state`;
        }
        for (let identifier of rule.name) {
            variable += `.${identifier.lexeme}`;
        }
        return variable;
    }
}
