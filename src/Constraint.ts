import ConstraintGenerator from './ConstraintGenerator';
import {ConstraintData, Evaluation} from "./Types";

/**
 * Represents a single constraint, with specified model and state data types.
 */
export default class Constraint<M, S> {
  private readonly generator: ConstraintGenerator;
  private readonly assertionFunction: Function;
  private readonly resource: ConstraintData;

  /**
   * Create a new constraint from constraint data.
   *
   * @param resource constraint data
   * @param generator constraint generator instance
   */
  constructor(resource: ConstraintData, generator: ConstraintGenerator) {
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
    try {
      let consistent = this.assertionFunction.apply(data, null);
      return {
        consistent: consistent,
        message:
          consistent || !this.resource.message
            ? ''
            : this.generator.getMessage(
                this.resource.message,
                data.model,
                data.state,
                data.functions
              ),
        resource: this.resource,
      };
    } catch (error) {
      let errorObj = {
        resource: this.resource,
        func: String(this.assertionFunction),
      };
      throw Error(
        'Invalid constraint function generated: ' + JSON.stringify(errorObj)
      );
    }
  }

  /**
   * Returns the original resource that was used to generate this constraint.
   */
  getResource(): ConstraintData {
    return this.resource;
  }
}
