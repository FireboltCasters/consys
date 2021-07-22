/**
 * Helper class to generate a javascript function.
 */
export default class FunctionGenerator {
  /**
   * Generates a javascript function from a string.
   *
   * @param fn function string
   */
  static generateFromString(fn: string): Function {
    return new Function(fn);
  }
}
