/**
 * These are all of the symbols used for the DSL.
 */
export class Symbols {
  // general
  static readonly COND_SEPARATOR = ':';
  static readonly KEY_SEPARATOR = '.';
  static readonly ARG_SEPARATOR = ',';

  // activation
  static readonly ALWAYS = 'ALWAYS';
  static readonly WHEN = 'WHEN';

  // data access
  static readonly MODEL_PREFIX = '$';
  static readonly STATE_PREFIX = '#';
  static readonly STRING_SYMBOL = "'";

  // comparison
  static readonly LESS = '<';
  static readonly LESS_EQUAL = '<=';
  static readonly EQUAL = '==';
  static readonly NOT_EQUAL = '!=';
  static readonly GREATER_EQUAL = '>=';
  static readonly GREATER = '>';

  // arithmetic
  static readonly PLUS = '+';
  static readonly MINUS = '-';
  static readonly TIMES = '*';
  static readonly DIV = '/';
  static readonly MOD = '%';
  static readonly PARENTHESIS_OPEN = '(';
  static readonly PARENTHESIS_CLOSE = ')';

  // logic
  static readonly AND = '&&';
  static readonly OR = '||';
  static readonly NOT = '!';
}
