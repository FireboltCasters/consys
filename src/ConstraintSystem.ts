import Constraint, {ConstraintData} from './Constraint';
import ConstraintGenerator from './ConstraintGenerator';
import ConstraintSystemPlugin from './ConstraintSystemPlugin';

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
    checkedModel: M,
    checkedState: S,
    checkedConstraints: ConstraintData[];
    evaluation: Evaluation[];
}

/**
 * A constraint system with multiple constraints and custom functions, defined for specific model and state types.
 */
export default class ConstraintSystem<M, S> {
    private readonly functions: { [key: string]: Function } = {};
    private readonly constraints: Constraint<any, M, S>[] = [];
    private readonly csl: ConstraintGenerator = new ConstraintGenerator();

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
                    .then(() =>
                        console.log('Registered plugin: ' + plugin.constructor.name)
                    )
            );
    }

    /**
     * Adds a constraint to this constraint system.
     *
     * @param resource constraint data
     */
    addConstraint<T extends ConstraintData>(resource: T) {
        this.constraints.push(new Constraint(resource, this.csl));
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
        this.csl.registerFunction(name);
    }

    /**
     * Evaluates one or more models and a state given all registered constraints and functions.
     *
     * @param model model to be evaluated
     * @param state state to be evaluated
     */
    evaluate(model: M | M[], state: S): Report<M, S>[] {
        if (model instanceof Array) {
            return this.evaluateMultiple(model, state);
        }
        return [this.evaluateSingle(model, state)];
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
        return this.csl.getMessage(msgString, model, state, this.functions);
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
            if (!evaluation.consistent) {
                evaluationRes.push(evaluation);
            }
        }
        let constraintData = this.getConstraintData();
        return {
            checkedModel: model,
            checkedState: state,
            checkedConstraints: constraintData,
            evaluation: evaluationRes
        };
    }
}
