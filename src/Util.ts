/**
 * Evaluation data for a single constraint.
 */
export interface Evaluation {
  consistent: boolean;
  message: string;
  resource: ConstraintData;
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
 * Statistics report, containing the number of occurrences of model and state variables in consistent and
 * inconsistent constraints, as well as the total number of constraints.
 */
export interface StatisticsReport {
  totalConstraints: number;
  consistent: {
    total: number;
    model: {[key: string]: number};
    state: {[key: string]: number};
  };
  inconsistent: {
    total: number;
    model: {[key: string]: number};
    state: {[key: string]: number};
  };
}

/**
 * Filter by resource.
 */
export type ResourceFilterFunction = (resource: ConstraintData) => boolean;

/**
 * Filter by evaluation.
 */
export type EvaluationFilerFunction = (evaluation: Evaluation) => boolean;

/**
 * Function type.
 */
export type FunctionType = (...args: any[]) => any;

/**
 * Statement type.
 */
export type StatementType<M, S> = (model: M, state: S) => any;

/**
 * Filter type for filtering evaluations.
 */
export type EvaluationFilter =
  | 'all'
  | 'consistent'
  | 'inconsistent'
  | ResourceFilterFunction;

/**
 * This is the minimum amount of data needed to generate a constraint.
 */
export interface ConstraintData {
  constraint: string;
  message?: string;
  [key: string]: any;
}

/**
 * Data needed to evaluate a constraint.
 */
export interface EvaluationData<M, S> {
  model: M;
  state: S;
  functions: {[key: string]: Function};
}

/**
 * Utility class.
 */
export default class Util {
  /**
   * Flatten an object and inserting 0 as each value.
   *
   * @param object object to be flattened
   * @param count initial count
   * @param parent parent key
   * @param res resulting map
   */
  static initCounts(
    object: any,
    count: number,
    parent?: string,
    res: {[key: string]: number} = {}
  ): {[key: string]: number} {
    for (let key in object) {
      let propertyName = parent ? parent + '.' + key : key;
      if (typeof object[key] == 'object' && !Array.isArray(object[key])) {
        Util.initCounts(object[key], count, propertyName, res);
      } else {
        res[propertyName] = count;
      }
    }
    return res;
  }
}

/**
 * Utility log class.
 */
export class Log {
  /**
   * Throw an error.
   *
   * @param msg error message
   */
  static error(msg: string): Error {
    return Error('[consys]: Error: ' + msg);
  }

  static reportError(what: string, where: string, message: string, position: number) {
    const prefix = `[consys]:`;
    const heading = `${what} error in:`;
    const whitespace = " ".repeat(position + 1);
    console.error(`${prefix} ${heading}\n${prefix} ${where}\n${prefix}${whitespace}^~~~~~ ${message}.`);
  }
}
