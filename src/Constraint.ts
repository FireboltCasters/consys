import ConstraintGenerator from './ConstraintGenerator';
import {ConstraintData, Evaluation, EvaluationData, Log} from './Util';

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
  evaluate(data: EvaluationData<M, S>): Evaluation {
    try {
      let consistent = this.isConsistent(data);
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
      throw Log.error(
        'Invalid constraint function generated: ' + JSON.stringify(errorObj)
      );
    }
  }

  /**
   * Checks if this constraint is consistent with given model, state and functions.
   *
   * @param data data to evaluate, along with functions
   */
  isConsistent(data: EvaluationData<M, S>): boolean {
    return this.assertionFunction.apply(data, null);
  }

  /**
   * Returns the original resource that was used to generate this constraint.
   */
  getResource(): ConstraintData {
    return this.resource;
  }
}
