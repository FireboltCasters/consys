import Constraint, {ConstraintData} from './Constraint';
import CSL from './CSL';
import ConstraintSystemPlugin from './ConstraintSystemPlugin';

export interface Evaluation {
  index?: number;
  consistent: boolean;
  message: string;
  resource: any;
}

export default class ConstraintSystem<M, S> {
  private readonly functions: {[key: string]: Function} = {};
  private readonly constraints: Constraint<any, M, S>[] = [];
  private readonly csl: CSL = new CSL();

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

  addConstraint<T extends ConstraintData>(resource: T) {
    this.constraints.push(new Constraint(resource, this.csl));
  }

  addFunction(name: string, fun: (...args: any[]) => any) {
    this.addFun(name, fun);
  }

  addStatement(name: string, fun: (model: M, state: S) => any) {
    this.addFun(name, fun);
  }

  private addFun(name: string, fun: Function) {
    this.functions[name] = fun;
    this.csl.registerFunction(name);
  }

  evaluate(model: M | M[], state: S): Evaluation[] {
    if (model instanceof Array) {
      return this.evaluateMultiple(model, state);
    }
    return this.evaluateSingle(model, state);
  }

  getMessage(msgString: string, model: M, state: S): string {
    return this.csl.getMessage(msgString, model, state, this.functions);
  }

  private evaluateMultiple(models: M[], state: S): Evaluation[] {
    let res = [];
    for (let i = 0; i < models.length; i++) {
      let model = models[i];
      let singleEvaluations = this.evaluateSingle(model, state);
      for (let j = 0; j < singleEvaluations.length; j++) {
        let singleEvaluation = singleEvaluations[i];
        singleEvaluation.index = i;
        res.push(singleEvaluation);
      }
    }
    return res;
  }

  private evaluateSingle(model: M, state: S): Evaluation[] {
    let res = [];
    let data = {
      model: model,
      state: state,
      functions: this.functions,
    };
    for (let i = 0; i < this.constraints.length; i++) {
      let constraint = this.constraints[i];
      let evaluation = constraint.evaluate(data);
      if (!evaluation.consistent) {
        res.push(evaluation);
      }
    }
    return res;
  }
}
