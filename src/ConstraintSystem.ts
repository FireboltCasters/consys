import Constraint, {ConstraintData} from './Constraint';
import ConstraintGenerator from './ConstraintGenerator';
import ConstraintSystemPlugin from './ConstraintSystemPlugin';
import Config from "./Config";

/**
 * Evaluation data for a single constraint.
 */
export interface Evaluation {
  consistent: boolean;
  message: string;
  resource: any;
}

/**
 * Evaluation report, used as the API for the client application.
 */
export interface Report<M, S> {
  checkedModel: M;
  checkedState: S;
  checkedConstraints: ConstraintData[];
  evaluation: Evaluation[];
}

/**
 * Filter function for evaluations.
 */
export type EvaluationFilterFunction = (evaluation: Evaluation) => boolean;

/**
 * Filter type for filtering evaluations.
 */
export type EvaluationFilter = "all" | "consistent" | "inconsistent" | EvaluationFilterFunction;

/**
 * A constraint system with multiple constraints and custom functions, defined for specific model and state types.
 */
export default class ConstraintSystem<M, S> {
  private readonly functions: {[key: string]: Function} = {};
  private readonly constraints: Constraint<any, M, S>[] = [];
  private readonly generator: ConstraintGenerator = new ConstraintGenerator();

  /**
   * For a given evaluation filter type, return the corresponding function
   *
   * @param evaluationFilter filter type
   * @private
   */
  private static getFilterFunction(evaluationFilter: EvaluationFilter): EvaluationFilterFunction {
    switch (evaluationFilter) {
      case "all":
        return () => true;
      case "consistent":
        return (evaluation: Evaluation) => evaluation.consistent;
      case "inconsistent":
        return (evaluation: Evaluation) => !evaluation.consistent;
      default:
        return evaluationFilter;
    }
  }

  /**
   * Registers a plugin for this constraint system.
   *
   * @param plugin plugin to be registered
   */
  async registerPlugin(plugin: ConstraintSystemPlugin<M, S>) {
    plugin
      .registerFunctions(this)
      .then(() =>
        plugin
          .registerConstraints(this)
          .then(() => {
            if (Config.DEBUG_LOG) {
              console.log('Registered plugin: ' + plugin.constructor.name)
            }
          })
      );
  }

  /**
   * Adds a constraint to this constraint system.
   *
   * @param resource constraint data
   */
  addConstraint<T extends ConstraintData>(resource: T) {
    this.constraints.push(new Constraint(resource, this.generator));
  }

  /**
   * Adds a custom function to this constraint system.
   *
   * @param name name of the function
   * @param fun custom function
   */
  addFunction(name: string, fun: (...args: any[]) => any) {
    this.addFun(name, fun);
  }

  /**
   * Adds a custom statement (function without any arguments) to this constraint system.
   *
   * @param name name of the statement
   * @param fun custom statement
   */
  addStatement(name: string, fun: (model: M, state: S) => any) {
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
  evaluate(model: M | M[], state: S, include: EvaluationFilter = "all"): Report<M, S>[] {
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
  private filterReportEvaluation(reports: Report<M, S>[], evaluationFilter: EvaluationFilter) {
    for (let report of reports) {
      let evaluation: Evaluation[] = report.evaluation;
      report.evaluation = evaluation.filter(ConstraintSystem.getFilterFunction(evaluationFilter));
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
    let data = {
      model: model,
      state: state,
      functions: this.functions,
    };
    for (let constraint of this.constraints) {
      let evaluation = constraint.evaluate(data);
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
