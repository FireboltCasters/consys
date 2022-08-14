import Lexer from "../dsl/Lexer";
import Parser from "../dsl/Parser";
import Emitter from "../dsl/Emitter";

const emitFromSource: (source: string) => string = (source: string) => {
    const lexer = new Lexer(source);
    const tokens = lexer.scan();
    const parser = new Parser(source, tokens);
    const ast = parser.parse();
    const emitter = new Emitter(ast);
    return emitter.emit();
};

test('Emitter returns empty string with no provided ast', () => {
    const emitter = new Emitter({root: null, source: ""});
    expect(emitter.emit()).toBe('');
});

test('Emitter replaces model and state identifiers with field', () => {
    expect(
        emitFromSource('ALWAYS : $first < #second.third')
    ).toBe('if(true){return(this.model.first<this.state.second.third);}else{return(true);}');
});

test('Emitter replaces model and state with objects', () => {
    expect(
        emitFromSource('ALWAYS : $ != #')
    ).toBe('if(true){return(this.model!=this.state);}else{return(true);}');
});

test('Emitter replaces function expression with field', () => {
    expect(
        emitFromSource('ALWAYS : FUNCTION')
    ).toBe(`if(true){return(this.functions['FUNCTION'](this.model,this.state));}else{return(true);}`);
});

test('Emitter calls function with correct arguments', () => {
    expect(
        emitFromSource(`ALWAYS : F(3.5, 'S', $, G(42))`)
    ).toBe(`if(true){return(this.functions['F'](3.5,'S',this.model,this.functions['G'](42)));}else{return(true);}`);
});

test('Emitter replaces AND, OR and NOT keywords with js equivalent', () => {
    expect(
        emitFromSource('ALWAYS : NOT A(-1) AND B(2) OR C(3)')
    ).toBe(`if(true){return(!this.functions['A'](-1)&&this.functions['B'](2)||this.functions['C'](3));}else{return(true);}`);
});
