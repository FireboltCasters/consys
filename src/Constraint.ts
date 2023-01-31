import {ConstraintData, Evaluation, EvaluationData, Log} from './Util';
import Lexer from './dsl/Lexer';
import Parser from './dsl/Parser';
import Emitter from './dsl/Emitter';
import FunctionGenerator from './ignoreCoverage/FunctionGenerator';
import TextProcessor from './dsl/TextProcessor';
import {Expression} from './dsl/Expression';

/**
 * Represents a single constraint, with specified model and state data types.
 */
export default class Constraint<M, S> {
  private textProcessor: TextProcessor<M, S> | undefined;
  private readonly assertionFunction: Function;
  private readonly resource: ConstraintData;
  private readonly ast: Expression.AST;

  /**
   * Create a new constraint from constraint data.
   *
   * @param resource constraint data
   */
  constructor(resource: ConstraintData) {
    this.resource = resource;
    const tokens = new Lexer(resource.constraint).scan();
    this.ast = new Parser(resource.constraint, tokens).parse();
    const js = new Emitter(this.ast).emit();
    this.assertionFunction = FunctionGenerator.generateFromString(js);
  }

  /**
   * Returns a map of the number of occurrences for each key of the model.
   */
  getModelVarOccurrences(): {[key: string]: number} {
    return this.ast.statistics.counts.model;
  }

  /**
   * Returns a map of the number of occurrences for each key of the state.
   */
  getStateVarOccurrences(): {[key: string]: number} {
    return this.ast.statistics.counts.state;
  }

  /**
   * Evaluate this constraint with a given model and state, along with custom functions.
   *
   * @param data data to evaluate, along with functions
   * @param rescan determine if the text processor should rescan if something has changed
   */
  evaluate(data: EvaluationData<M, S>, rescan: boolean): Evaluation {
    if (!this.textProcessor) {
      this.textProcessor = new TextProcessor(
        !!this.resource.message ? this.resource.message : '',
        data.functions
      );
    }
    try {
      const consistent = this.isConsistent(data);
      return {
        consistent: consistent,
        message:
          consistent || !this.resource.message
            ? ''
            : this.textProcessor.process(
                data.model,
                data.state,
                data.functions,
                rescan
              ),
        resource: this.resource,
      };
    } catch (error) {
      const errorVariable = error.message;
      const variable = errorVariable.substring(1);
      const isModel = errorVariable.startsWith('$');
      const type = isModel ? 'model' : 'state';
      const provided = isModel ? data.model : data.state;
      const position = this.resource.constraint.indexOf(variable);
      Log.reportError(
        'Evaluation',
        this.resource.constraint,
        `Attribute '${variable}' not found in ${type}: ${JSON.stringify(
          provided
        )}`,
        position
      );
      return {
        consistent: false,
        message: !this.resource.message
          ? ''
          : this.textProcessor.process(
              data.model,
              data.state,
              data.functions,
              rescan
            ),
        resource: this.resource,
      };
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
