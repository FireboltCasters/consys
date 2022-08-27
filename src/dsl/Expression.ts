import Token from './Token';

/**
 * Utility class to print an ast.
 */
class ASTPrinter implements Expression.Visitor<string> {
  /**
   * Returns the string representation of a given ast.
   * @param ast ast to be printed
   */
  print(ast: Expression.AST): string {
    return ast.root?.accept(this) || ``;
  }

  visitBinaryExpression(expression: Expression.Binary): string {
    return this.parenthesize(
      expression.operator.lexeme,
      expression.left,
      expression.right
    );
  }

  visitGroupingExpression(expression: Expression.Grouping): string {
    return this.parenthesize(`group`, expression.expression);
  }

  visitLiteralExpression(expression: Expression.Literal): string {
    return expression.value.toString();
  }

  visitLogicalExpression(expression: Expression.Logical): string {
    return this.parenthesize(
      expression.operator.lexeme,
      expression.left,
      expression.right
    );
  }

  visitUnaryExpression(expression: Expression.Unary): string {
    return this.parenthesize(expression.operator.lexeme, expression.right);
  }

  private parenthesize(name: string, ...expressions: Expression.Expression[]) {
    return `(${name} ${expressions.map(e => e.accept(this)).join(` `)})`;
  }

  visitConstraintExpression(rule: Expression.Constraint): string {
    return `(activation ${rule.activation.accept(
      this
    )} assertion ${rule.assertion.accept(this)})`;
  }

  visitFunctionExpression(rule: Expression.Function): string {
    return this.parenthesize(rule.name.lexeme, ...rule.args);
  }

  visitVariableExpression(rule: Expression.Variable): string {
    return `${rule.type.lexeme} ${rule.name.map(e => e.lexeme).join(`.`)}`;
  }
}

export namespace Expression {
  export type Statistics = {
    counts: {
      model: {[key: string]: number};
      state: {[key: string]: number};
    };
  };

  /**
   * Represents the root node of an abstract syntax tree that was created from a given source.
   */
  export class AST {
    readonly root: Expression.Expression | null;
    readonly source: string;
    readonly statistics: Statistics;

    constructor(
      root: Expression.Expression | null,
      source: string,
      statistics: Statistics
    ) {
      this.root = root;
      this.source = source;
      this.statistics = statistics;
    }

    toString(): string {
      return new ASTPrinter().print(this);
    }
  }

  /**
   * Implementations of this interface can use these methods to traverse the ast.
   */
  export interface Visitor<T> {
    visitBinaryExpression(expression: Expression.Binary): T;
    visitConstraintExpression(expression: Expression.Constraint): T;
    visitFunctionExpression(expression: Expression.Function): T;
    visitGroupingExpression(expression: Expression.Grouping): T;
    visitLiteralExpression(expression: Expression.Literal): T;
    visitLogicalExpression(expression: Expression.Logical): T;
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

  export class Logical implements Expression {
    readonly left: Expression;
    readonly operator: Token;
    readonly right: Expression;

    constructor(left: Expression, operator: Token, right: Expression) {
      this.left = left;
      this.operator = operator;
      this.right = right;
    }

    accept<T>(visitor: Expression.Visitor<T>): T {
      return visitor.visitLogicalExpression(this);
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
