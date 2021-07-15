

export default class FunctionGenerator {

    static generateFromString(fn: string): Function {
        return new Function(fn);
    }
}
