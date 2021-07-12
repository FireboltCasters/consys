import CSL from './CSL';
import {Evaluation} from './ConstraintSystem';

export interface ConstraintData {
  assertion: string;
  message: string;
}

export default class Constraint<T extends ConstraintData, M, S> {
  private readonly assertionFunction: Function;
  private readonly resource: T;
  private readonly csl: CSL;

  constructor(resource: T, csl: CSL) {
    this.resource = resource;
    this.csl = csl;
    this.assertionFunction = this.csl.generateFunction(resource);
  }

  evaluate<
    D extends {model: M; state: S; functions: {[key: string]: Function}}
  >(data: D): Evaluation {
    let consistent = this.assertionFunction.apply(data, null);
    return {
      consistent: consistent,
      message: consistent
        ? ''
        : this.csl.getMessage(
            this.resource.message,
            data.model,
            data.state,
            data.functions
          ),
      resource: this.resource,
    };
  }
}
