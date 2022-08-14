import Util, {ConstraintData, Evaluation, EvaluationData, Log} from './Util';
import {Symbols} from './Symbols';
import Lexer from "./dsl/Lexer";
import Parser from "./dsl/Parser";
import Emitter from "./dsl/Emitter";
import FunctionGenerator from "./ignoreCoverage/FunctionGenerator";
import {Expression} from "./dsl/Expression";
import TextProcessor from "./dsl/TextProcessor";

/**
 * Represents a single constraint, with specified model and state data types.
 */
export default class Constraint<M, S> {

  private readonly textProcessor: TextProcessor<M, S>;
  private readonly assertionFunction: Function;
  private readonly resource: ConstraintData;

  // used for statistics analysis
  private modelVarOccurrences: {[key: string]: number} = {};
  private stateVarOccurrences: {[key: string]: number} = {};
  private initializedStatistics: boolean = false;

  private readonly ast: Expression.AST;

  /**
   * Create a new constraint from constraint data.
   *
   * @param resource constraint data
   */
  constructor(resource: ConstraintData) {
    this.resource = resource;
    this.textProcessor = new TextProcessor(!!resource.message ? resource.message : "");

    let source = resource.constraint;
    let tokens = new Lexer(source).scan();
    this.ast = new Parser(source, tokens).parse();

    let js = new Emitter(this.ast).emit();
    this.assertionFunction = FunctionGenerator.generateFromString(js);
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
   * @param rescan determine if the text processor should rescan if something has changed
   */
  evaluate(data: EvaluationData<M, S>, rescan: boolean): Evaluation {
    try {
      let consistent = this.isConsistent(data);
      return {
        consistent: consistent,
        message:
          consistent || !this.resource.message
            ? ''
            : this.textProcessor.process(data.model, data.state, data.functions, rescan),
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
