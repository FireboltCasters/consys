import ConstraintSystem, {Evaluation} from './ConstraintSystem';

export default abstract class ConstraintSystemPlugin<M, S> {
  private readonly system: ConstraintSystem<M, S> = new ConstraintSystem<
    M,
    S
  >();

  async init() {
    await this.system.registerPlugin(this);
  }

  evaluate(model: M | M[], state: S): Evaluation[] {
    return this.system.evaluate(model, state);
  }

  abstract registerConstraints(system: ConstraintSystem<M, S>): Promise<void>;

  abstract registerFunctions(system: ConstraintSystem<M, S>): Promise<void>;
}
