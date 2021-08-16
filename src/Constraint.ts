import ConstraintGenerator from './ConstraintGenerator';
import Util, {ConstraintData, Evaluation, EvaluationData, Log} from './Util';
import {Symbols} from './Symbols';

/**
 * Represents a single constraint, with specified model and state data types.
 */
export default class Constraint<M, S> {
  // used for generation and evaluation
  private readonly generator: ConstraintGenerator;
  private readonly assertionFunction: Function;
  private readonly resource: ConstraintData;

  // used for statistics analysis
  private modelVarOccurrences: {[key: string]: number} = {};
  private stateVarOccurrences: {[key: string]: number} = {};
  private initializedStatistics: boolean = false;

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
   * Returns the corresponding regex to find a model or state variable in a string.
   *
   * @param key variable key
   * @param prefix key prefix
   * @private
   */
  private static getRegexForKey(key: string, prefix: string): RegExp {
    return new RegExp(
      '\\' + prefix + key.replace('.', '\\.') + '(?!(\\w|\\.))',
      'g'
    );
  }

  /**
   * Returns a map from each key of the given object to the number of occurrences of that key in this constraint.
   *
   * @param object model or state
   * @param prefix indicate if the object is a model or state
   * @private
   */
  private countOccurrences(
    object: M | S,
    prefix: string
  ): {[key: string]: number} {
    let constraintString = this.resource.constraint;
    let res: {[key: string]: number} = Util.initCounts(object, 0);
    for (let key of Object.keys(res)) {
      let regex = Constraint.getRegexForKey(key, prefix);
      res[key] = constraintString.match(regex)?.length || 0;
    }
    return res;
  }

  /**
   * Initializes the counts if not already done.
   *
   * @param model model to be counted
   * @param state state to be counted
   * @private
   */
  private initStatistics(model: M, state: S) {
    if (!this.initializedStatistics) {
      this.modelVarOccurrences = this.countOccurrences(
        model,
        Symbols.MODEL_PREFIX
      );
      this.stateVarOccurrences = this.countOccurrences(
        state,
        Symbols.STATE_PREFIX
      );
      this.initializedStatistics = true;
    }
  }

  /**
   * Returns a map of the number of occurrences for each key of the model.
   */
  getModelVarOccurrences(): {[key: string]: number} {
    return this.modelVarOccurrences;
  }

  /**
   * Returns a map of the number of occurrences for each key of the state.
   */
  getStateVarOccurrences(): {[key: string]: number} {
    return this.stateVarOccurrences;
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
    this.initStatistics(data.model, data.state);
    return this.assertionFunction.apply(data, null);
  }

  /**
   * Returns the original resource that was used to generate this constraint.
   */
  getResource(): ConstraintData {
    return this.resource;
  }
}
