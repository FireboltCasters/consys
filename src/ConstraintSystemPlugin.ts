import ConstraintSystem, {Report} from './ConstraintSystem';

/**
 * This is the basic API for a custom constraint system plugin with client defined constraints and functions.
 */
export default abstract class ConstraintSystemPlugin<M, S> {
  private readonly system: ConstraintSystem<M, S> = new ConstraintSystem<
    M,
    S
  >();

  /**
   * Must be called before using, to register all constraints and functions.
   */
  async init() {
    await this.system.registerPlugin(this);
  }

  /**
   * Evaluates one or multiple models and a state.
   *
   * @param model model(s) to be evaluated
   * @param state state to be evaluated
   */
  evaluate(model: M | M[], state: S): Report<M, S>[] {
    return this.system.evaluate(model, state);
  }

  /**
   * All constraints must be registered in this function.
   *
   * @param system the system for which the constraints are registered
   */
  abstract registerConstraints(system: ConstraintSystem<M, S>): Promise<void>;

  /**
   * All custom functions and statements must be registered in this function.
   *
   * @param system the system for which the custom functions and statements are registered
   */
  abstract registerFunctions(system: ConstraintSystem<M, S>): Promise<void>;
}
