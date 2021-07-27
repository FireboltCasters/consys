import ConstraintSystem from './ConstraintSystem';

/**
 * This is the basic API for a custom constraint system plugin with client defined constraints and functions.
 */
export default abstract class ConstraintSystemPlugin<M, S> {

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
