import Lexer from "../dsl/Lexer";
import Parser from "../dsl/Parser";
import Interpreter from "../dsl/Interpreter";


const interpretFromSource: (source: string, model?: any, state?: any, functions?: any) => any
    = (source: string, model: any, state: any, functions: any) => {
    const lexer = new Lexer(source);
    const tokens = lexer.scan();
    const parser = new Parser(source, tokens);
    const ast = parser.parse();
    const interpreter = new Interpreter();
    return interpreter.interpret(ast, model, state, functions);
};

test('Interpreter returns correct result for trivial expressions', () => {
    expect(interpretFromSource('ALWAYS: 4 + 4 * 2')).toBe(12);
    expect(interpretFromSource('ALWAYS: 42 > 42')).toBe(false);
    expect(interpretFromSource('ALWAYS: 42 >= 42')).toBe(true);
    expect(interpretFromSource('ALWAYS: 42 == 42')).toBe(true);
    expect(interpretFromSource('ALWAYS: 42 != 42')).toBe(false);
    expect(interpretFromSource('ALWAYS: 42 != -42')).toBe(true);
    expect(interpretFromSource('ALWAYS: 42 <= 42')).toBe(true);
    expect(interpretFromSource('ALWAYS: 42 < 42')).toBe(false);
    expect(interpretFromSource('ALWAYS: (1 + (2 * (3 + 4) + 5) - 6 + (7 + 8 + 1)) / 3.0')).toBe(10);
});

test('Interpreter returns correct result with model and state variables', () => {
    const model = { value: 10, nested: { value: 20 } };
    const state = { first: 30, second: { third: 40 } };
    expect(interpretFromSource('ALWAYS: $value == #first / 3', model, state)).toBe(true);
    expect(interpretFromSource('ALWAYS: $nested.value == #second.third / 2', model, state)).toBe(true);
    expect(interpretFromSource('ALWAYS: $', model, state)).toBe(JSON.stringify(model));
    expect(interpretFromSource('ALWAYS: #', model, state)).toBe(JSON.stringify(state));
});

test('Interpreter returns correct result with function calls', () => {
    const functions = {
        LENGTH: (text: string) => text.length,
        TRUE: () => true,
        FALSE: () => false
    };
    expect(interpretFromSource(`ALWAYS: LENGTH('Testing')`, null, null, functions)).toBe(7);
    expect(interpretFromSource(`ALWAYS: LENGTH('Test ing')`, null, null, functions)).toBe(8);
    expect(interpretFromSource(`ALWAYS: TRUE AND FALSE`, null, null, functions)).toBe(false);
    expect(interpretFromSource(`ALWAYS: TRUE AND TRUE`, null, null, functions)).toBe(true);
    expect(interpretFromSource(`ALWAYS: FALSE OR TRUE`, null, null, functions)).toBe(true);
});
