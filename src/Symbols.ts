

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
    static readonly BRACKET_OPEN = '(';
    static readonly BRACKET_CLOSE = ')';

    // logic
    static readonly AND = '&&';
    static readonly OR = '||';
    static readonly NOT = '!';

    // only the start symbol of each operator, used for parsing
    static readonly OPERATOR_START = [
        Symbols.LESS,
        Symbols.LESS_EQUAL,
        Symbols.EQUAL,
        Symbols.NOT_EQUAL,
        Symbols.GREATER_EQUAL,
        Symbols.GREATER,
        Symbols.PLUS,
        Symbols.MINUS,
        Symbols.TIMES,
        Symbols.DIV,
        Symbols.MOD,
        Symbols.BRACKET_OPEN,
        Symbols.BRACKET_CLOSE,
        Symbols.AND,
        Symbols.OR,
        Symbols.NOT
    ].map(symbol => symbol.charAt(0));
}
