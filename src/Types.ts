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
 * This is the minimum amount of data needed to generate and evaluate a constraint.
 */
export interface ConstraintData {
    constraint: string;
    message?: string;
    [key: string]: any;
}
