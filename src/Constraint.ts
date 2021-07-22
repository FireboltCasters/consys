import ConstraintGenerator from './ConstraintGenerator';
import {Evaluation} from './ConstraintSystem';

/**
 * This is the minimum amount of data needed to generate and evaluate a constraint.
 */
export interface ConstraintData {
  assertion: string;
  message: string;
}

/**
 * Represents a single constraint, with specified model and state data types.
 */
export default class Constraint<T extends ConstraintData, M, S> {
  private readonly assertionFunction: Function;
  private readonly resource: T;
  private readonly generator: ConstraintGenerator;

  /**
   * Create a new constraint from constraint data.
   *
   * @param resource constraint data
   * @param generator constraint generator instance
   */
  constructor(resource: T, generator: ConstraintGenerator) {
    this.resource = resource;
    this.generator = generator;
    this.assertionFunction = this.generator.generateFunction(resource);
  }

  /**
   * Evaluate this constraint with a given model and state, along with custom functions.
   *
   * @param data data to evaluate, along with functions
   */
  evaluate<
    D extends {model: M; state: S; functions: {[key: string]: Function}}
  >(data: D): Evaluation {
    let consistent = this.assertionFunction.apply(data, null);
    return {
      consistent: consistent,
      message: consistent
        ? ''
        : this.generator.getMessage(
            this.resource.message,
            data.model,
            data.state,
            data.functions
          ),
      resource: this.resource,
    };
  }

  /**
   * Returns the original resource that was used to generate this constraint.
   */
  getResource(): T {
    return this.resource;
  }
}
