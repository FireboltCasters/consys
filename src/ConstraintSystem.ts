import ConstraintGenerator from './ConstraintGenerator';
import ConstraintSystemPlugin from './ConstraintSystemPlugin';
import {
  ConstraintData,
  Evaluation, EvaluationData,
  EvaluationFilerFunction,
  EvaluationFilter,
  FunctionType,
  Log,
  Report,
  StatementType,
} from './Util';
import Constraint from './Constraint';

/**
 * A constraint system with multiple constraints and custom functions, defined for specific model and state types.
 */
export default class ConstraintSystem<M, S> {
  private readonly generator: ConstraintGenerator = new ConstraintGenerator();
  private readonly constraints: Constraint<M, S>[] = [];
  private readonly functions: {[key: string]: Function} = {};
  private evaluationData: EvaluationData<M, S> | null = null;

  /**
   * For a given evaluation filter type, return the corresponding function
   *
   * @param evaluationFilter filter type
   * @private
   */
  private static getFilterFunction(
    evaluationFilter: EvaluationFilter
  ): EvaluationFilerFunction {
    switch (evaluationFilter) {
      case 'all':
        return () => true;
      case 'consistent':
        return (evaluation: Evaluation) => evaluation.consistent;
      case 'inconsistent':
        return (evaluation: Evaluation) => !evaluation.consistent;
      default:
        return (evaluation: Evaluation) =>
          evaluationFilter(evaluation.resource);
    }
  }

  /**
   * Registers a plugin for this constraint system.
   *
   * @param plugin plugin to be registered
   */
  async registerPlugin(plugin: ConstraintSystemPlugin<M, S>) {
    await plugin.registerFunctions(this);
    await plugin.registerConstraints(this);
    Log.print('Registered plugin: ' + plugin.constructor.name);
  }

  /**
   * Adds a constraint to this constraint system.
   *
   * @param resource constraint data
   */
  addConstraint(resource: ConstraintData) {
    this.constraints.push(new Constraint(resource, this.generator));
  }

  /**
   * Adds an array of constraints to this constraint system.
   *
   * @param resources constraint data
   */
  addConstraints(resources: ConstraintData[]) {
    for (let resource of resources) {
      this.addConstraint(resource);
    }
  }

  /**
   * Adds a custom function to this constraint system.
   *
   * @param name name of the function
   * @param fun custom function
   */
  addFunction(name: string, fun: FunctionType) {
    this.addFun(name, fun);
  }

  /**
   * Adds a custom statement (function without any arguments) to this constraint system.
   *
   * @param name name of the statement
   * @param fun custom statement
   */
  addStatement(name: string, fun: StatementType<M, S>) {
    this.addFun(name, fun);
  }

  /**
   * Helper function to add a custom function or statement.
   *
   * @param name name of the function or statement
   * @param fun custom function or statement
   * @private
   */
  private addFun(name: string, fun: Function) {
    if (this.functions[name] !== undefined) {
      throw Log.error('Function with name ' + name + ' is already registered');
    }
    this.functions[name] = fun;
    this.generator.registerFunction(name);
  }

  /**
   * Evaluates one or more models and a state given all registered constraints and functions.
   *
   * @param model model to be evaluated
   * @param state state to be evaluated
   * @param include optionally filter evaluations of reports
   */
  evaluate(
    model: M | M[],
    state: S,
    include: EvaluationFilter = 'all'
  ): Report<M, S>[] {
    let reports: Report<M, S>[];
    if (model instanceof Array) {
      reports = this.evaluateMultiple(model, state);
    } else {
      reports = [this.evaluateSingle(model, state)];
    }
    this.filterReportEvaluation(reports, include);
    return reports;
  }

  /**
   * Filters evaluations of reports based on a given function.
   *
   * @param reports reports for which evaluations are filtered
   * @param evaluationFilter filter function
   * @private
   */
  private filterReportEvaluation(
    reports: Report<M, S>[],
    evaluationFilter: EvaluationFilter
  ) {
    for (let report of reports) {
      let evaluation: Evaluation[] = report.evaluation;
      report.evaluation = evaluation.filter(
        ConstraintSystem.getFilterFunction(evaluationFilter)
      );
    }
  }

  /**
   * Evaluates multiple models and a single state.
   *
   * @param models models to be evaluated
   * @param state state to be evaluated
   * @private
   */
  private evaluateMultiple(models: M[], state: S): Report<M, S>[] {
    let reports: Report<M, S>[] = [];
    for (let model of models) {
      let report = this.evaluateSingle(model, state);
      reports.push(report);
    }
    return reports;
  }

  /**
   * Evaluates a single model and state.
   *
   * @param model model to be evaluated
   * @param state state to be evaluated
   * @private
   */
  private evaluateSingle(model: M, state: S): Report<M, S> {
    let evaluationRes = [];
    this.updateEvaluationData(model, state);
    for (let constraint of this.constraints) {
      let evaluation = constraint.evaluate(this.evaluationData!!);
      evaluationRes.push(evaluation);
    }
    let constraintData = this.getConstraintData();
    return {
      checkedModel: model,
      checkedState: state,
      checkedConstraints: constraintData,
      evaluation: evaluationRes,
    };
  }

  /**
   * Returns the number of constraints that are inconsistent with the given model and state.
   *
   * @param model model to be evaluated
   * @param state state to be evaluated
   */
  getNumInconsistentConstraints(model: M, state: S): number {
    this.updateEvaluationData(model, state);
    let numInconsistent = 0;
    for (let constraint of this.constraints) {
      if (!constraint.isConsistent(this.evaluationData!!)) {
        numInconsistent++;
      }
    }
    return numInconsistent;
  }

  /**
   * Returns the number of constraints that are consistent with the given model and state.
   *
   * @param model model to be evaluated
   * @param state state to be evaluated
   */
  getNumConsistentConstraints(model: M, state: S): number {
    return this.constraints.length - this.getNumInconsistentConstraints(model, state);
  }

  /**
   * Returns the number of constraints that were added to this system.
   */
  getNumConstraints(): number {
    return this.constraints.length;
  }

  /**
   * Updates the data used to evaluate constraints with the new model, state and functions.
   *
   * @param model new model
   * @param state new state
   * @private
   */
  private updateEvaluationData(model: M, state: S) {
    if (!this.evaluationData) {
      this.evaluationData = {
        model: model,
        state: state,
        functions: this.functions,
      };
    } else {
      this.evaluationData.model = model;
      this.evaluationData.state = state;
      this.evaluationData.functions = this.functions;
    }
  }

  /**
   * Returns a converted message string by replacing function calls or model and state variables with their
   * actual current value.
   *
   * @param msgString message to be converted
   * @param model model
   * @param state state
   */
  getMessage(msgString: string, model: M, state: S): string {
    return this.generator.getMessage(msgString, model, state, this.functions);
  }

  /**
   * Returns all constraint data that was registered.
   * @private
   */
  private getConstraintData(): ConstraintData[] {
    let res: ConstraintData[] = [];
    for (let constraint of this.constraints) {
      res.push(constraint.getResource());
    }
    return res;
  }
}
