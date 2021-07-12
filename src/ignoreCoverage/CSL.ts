import {ConstraintData} from './Constraint';

class Symbols {
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

  static readonly STATEMENT_START = [
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
  ].map(symbol => symbol.charAt(0));
}

export default class CSL {
  private readonly customFunctions: string[] = [];

  private static getObjectValue<T>(object: T, keyChain: string): any {
    try {
      let value: any = object;
      let keys = keyChain.split(Symbols.KEY_SEPARATOR);
      for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        value = value[key];
      }

      return value;
    } catch (err) {
      return 'UNDEFINED_VALUE';
    }
  }

  private static getSubstringWithinBrackets(srcString: string): string {
    let bracketStart = srcString.indexOf(Symbols.BRACKET_OPEN) + 1;
    let bracketEnd = bracketStart;
    let numBracketsOpened = 0;
    for (let i = bracketStart; i < srcString.length; i++) {
      let char = srcString.charAt(i);
      if (char === Symbols.BRACKET_OPEN) {
        numBracketsOpened++;
      } else if (char === Symbols.BRACKET_CLOSE) {
        if (numBracketsOpened > 0) {
          numBracketsOpened--;
        } else if (numBracketsOpened === 0) {
          bracketEnd = i;
          break;
        } else {
          throw Error('Invalid syntax in token: ' + srcString);
        }
      }
    }

    return srcString.substring(bracketStart, bracketEnd);
  }

  private static isNumberString(string: string): boolean {
    return !!string.match(/[+-]?([0-9]*[.])?[0-9]+/);
  }

  private static isString(string: string): boolean {
    return (
      string.startsWith(Symbols.STRING_SYMBOL) &&
      string.endsWith(Symbols.STRING_SYMBOL)
    );
  }

  private static isModelValue(string: string): boolean {
    return string.startsWith(Symbols.MODEL_PREFIX);
  }

  private static isStateValue(string: string): boolean {
    return string.startsWith(Symbols.STATE_PREFIX);
  }

  registerFunction(name: string) {
    if (this.customFunctions.includes(name)) {
      throw Error('Function with name ' + name + ' is already registered');
    }
    this.customFunctions.push(name);
  }

  isCharWithinString(srcString: string, charIndex: number): boolean {
    if (
      charIndex === 0 ||
      charIndex === srcString.length - 1 ||
      srcString.charAt(charIndex) === Symbols.STRING_SYMBOL
    ) {
      return false;
    }
    let numStringSymbols = 0;
    for (let i = charIndex + 1; i < srcString.length; i++) {
      let char = srcString.charAt(i);
      if (char === Symbols.STRING_SYMBOL) {
        numStringSymbols++;
      }
    }
    return numStringSymbols % 2 === 1;
  }

  isCharWithinFunction(srcString: string, charIndex: number): boolean {
    let char = srcString.charAt(charIndex);
    if (
      charIndex === 0 ||
      charIndex === srcString.length - 1 ||
      char === '(' ||
      char === ')'
    ) {
      return false;
    }

    let openingBracketIndices: number[] = [];
    for (let i = 0; i < srcString.length; i++) {
      let char = srcString.charAt(i);
      if (char === '(') {
        openingBracketIndices.push(i);
      }
    }

    for (let i = 0; i < openingBracketIndices.length; i++) {
      let openingBracketIndex = openingBracketIndices[i];

      // we dont care if the bracket was the first char, because then it cannot be a function
      if (openingBracketIndex === 0) {
        continue;
      }

      let leftCharOfOpeningBracket = srcString.charAt(openingBracketIndex - 1);

      // we have a function, now look for its enclosing bracket
      if (leftCharOfOpeningBracket.match(/\w/g)) {
        let numBrackets = 1;
        let closingBracketIndex = -1;
        for (let j = openingBracketIndex + 1; j < srcString.length; j++) {
          let char = srcString.charAt(j);
          if (char === '(') {
            numBrackets++;
          } else if (char === ')') {
            numBrackets--;
          }
          if (numBrackets === 0) {
            closingBracketIndex = j;
            break;
          }
        }
        if (closingBracketIndex === -1) {
          throw Error('Syntax error in function: ' + srcString);
        }
        if (
          charIndex > openingBracketIndex &&
          charIndex < closingBracketIndex
        ) {
          return true;
        }
      }
    }
    return false;
  }

  cutRemainderUntilCharMatches(srcString: string, charRegex: RegExp): string {
    let endIndex = srcString.length - 1;
    let char = srcString.charAt(endIndex);
    while (!char.match(charRegex) && endIndex > 0) {
      char = srcString.charAt(--endIndex);
    }
    return srcString.substring(0, endIndex + 1);
  }

  cutFrontUntilCharMatches(srcString: string, charRegex: RegExp): string {
    let startIndex = 0;
    let char = srcString.charAt(startIndex);
    while (!char.match(charRegex) && startIndex < srcString.length - 1) {
      char = srcString.charAt(++startIndex);
    }
    return srcString.substring(startIndex);
  }

  getMessageTokens(srcString: string): string[] {
    let modelRegex = new RegExp('\\' + Symbols.MODEL_PREFIX, 'g');
    let stateRegex = new RegExp('\\' + Symbols.STATE_PREFIX, 'g');

    let res: string[] = [];
    let tokenStart = 0;
    for (let i = 0; i < srcString.length - 1; i++) {
      let char = srcString.charAt(i);
      let nextChar = srcString.charAt(i + 1);

      // start of a word that is not the argument of a function call
      if (
        char.match(/\s/g) &&
        nextChar.match(/^(?!.*\s).*$/g) &&
        !this.isCharWithinFunction(srcString, i)
      ) {
        tokenStart = i + 1;
      }

      // we have the end of a word that is not an argument of a function call
      if (
        char.match(/^(?!.*\s).*$/g) &&
        nextChar.match(/\s/g) &&
        !this.isCharWithinFunction(srcString, i)
      ) {
        res.push(srcString.substring(tokenStart, i + 1));
      }

      if (i === srcString.length - 2) {
        res.push(srcString.substring(tokenStart, i + 2));
      }
    }

    for (let i = 0; i < res.length; i++) {
      let token = res[i];
      if (this.isStatementToken(token)) {
        res[i] = this.cutRemainderUntilCharMatches(token, /\w/g);
      } else if (this.isFunctionToken(token)) {
        res[i] = this.cutRemainderUntilCharMatches(token, /\)/g);
      } else if (token.includes(Symbols.MODEL_PREFIX)) {
        let trimmed = this.cutRemainderUntilCharMatches(token, /\w/g);
        trimmed = this.cutFrontUntilCharMatches(trimmed, modelRegex);
        res[i] = trimmed;
      } else if (token.includes(Symbols.STATE_PREFIX)) {
        let trimmed = this.cutRemainderUntilCharMatches(token, /\w/g);
        trimmed = this.cutFrontUntilCharMatches(trimmed, stateRegex);
        res[i] = trimmed;
      }
    }

    return res;
  }

  getSplitTokens(srcString: string): string[] {
    let splitIndex = -1;
    for (let i = 0; i < srcString.length; i++) {
      let char = srcString.charAt(i);
      if (
        char === Symbols.COND_SEPARATOR &&
        !this.isCharWithinString(srcString, i)
      ) {
        splitIndex = i;
        break;
      }
    }
    if (splitIndex === -1) {
      throw Error('Invalid syntax for token: ' + srcString);
    }
    let res: string[] = [];
    res.push(srcString.substring(0, splitIndex));
    res.push(srcString.substring(splitIndex + 1));
    return res;
  }

  generateFunction<T extends ConstraintData>(resource: T): Function {
    try {
      let assertion = resource.assertion;
      let tokens = this.getSplitTokens(assertion);

      let activationToken = tokens[0].trim();
      let conditionToken = tokens[1].trim();

      let activationString = 'false';

      if (activationToken.startsWith(Symbols.ALWAYS)) {
        activationString = 'true';
      } else if (activationToken.startsWith(Symbols.WHEN)) {
        let activationData = CSL.getSubstringWithinBrackets(activationToken);
        activationString = this.generateConditionalString(activationData);
      } else if (this.isStatementToken(activationToken)) {
        activationString = `this.functions['${activationToken}'](this.model,this.state)`;
      }

      let conditionString = this.generateConditionalString(conditionToken);
      let functionString = `if(${activationString}){return(${conditionString});}else{return(true);}`;

      console.log('Generated constraint: ', functionString);

      return new Function(functionString);
    } catch (err) {
      throw err;
    }
  }

  private generateConditionalString(data: string): string {
    let trimmed = data.replace(/\s/g, '');

    let tokens: string[] = [];
    let done = false;
    let startIndex = 0;
    let endIndex = 0;
    let iterations = 0;
    while (!done) {
      let startChar = trimmed[startIndex];

      // we have data access, so look for the char of the next statement to find the end index
      if (
        startChar === Symbols.MODEL_PREFIX ||
        startChar === Symbols.STATE_PREFIX
      ) {
        for (let i = startIndex + 1; i < trimmed.length; i++) {
          let endChar = trimmed.charAt(i);
          if (i === trimmed.length - 1) {
            endIndex = i + 1;
            break;
          } else if (!endChar.match(/\w|\./g)) {
            endIndex = i;
            break;
          }
        }

        // we have a string here, so just look for the end string quotation to find the end index
      } else if (startChar === Symbols.STRING_SYMBOL) {
        for (let i = startIndex + 1; i < trimmed.length; i++) {
          let endChar = trimmed.charAt(i);
          if (endChar === Symbols.STRING_SYMBOL) {
            endIndex = i + 1;
            break;
          }
        }

        // we have a number, so look for the next char that is not a dot or a number to find the end index
      } else if (startChar.match(/[0-9]/g)) {
        for (let i = startIndex; i < trimmed.length; i++) {
          let endChar = trimmed.charAt(i);
          if (i === trimmed.length - 1) {
            endIndex = i + 1;
            break;
          } else if (!endChar.match(/[0-9]|\./g)) {
            endIndex = i;
            break;
          }
        }

        // we have a function, so look for the last closing bracket to find the end index
      } else if (this.isFunctionToken(trimmed.substring(startIndex))) {
        let numBrackets = 0;
        let foundFirst = false;
        for (let i = startIndex + 1; i < trimmed.length; i++) {
          let endChar = trimmed.charAt(i);
          if (endChar === '(') {
            numBrackets++;
            foundFirst = true;
          } else if (endChar === ')') {
            numBrackets--;
          }
          if (foundFirst && numBrackets === 0) {
            endIndex = i + 1;
            break;
          }
          if (numBrackets === 0 && !endChar.match(/\w/g)) {
            foundFirst = true;
            endIndex = i;
            break;
          }
        }

        // no brackets, so this is a statement
        if (!foundFirst) {
          for (let i = startIndex + 1; i < trimmed.length; i++) {
            let endChar = trimmed.charAt(i);
            if (i === trimmed.length - 1) {
              endIndex = i + 1;
              break;
            } else if (!endChar.match(/\w/g)) {
              endIndex = i;
              break;
            }
          }
        }

        // we have some sort of statement here, we must do this by hand unfortunately
      } else if (Symbols.STATEMENT_START.includes(startChar)) {
        // this definitely needs to be refactored at some point
        if (
          startChar === '<' ||
          startChar === '>' ||
          startChar === '!' ||
          startChar === '='
        ) {
          let nextChar = trimmed[startIndex + 1];
          endIndex = startIndex + (nextChar === '=' ? 2 : 1);
        } else if (startChar === '&' || startChar === '|') {
          endIndex = startIndex + 2;
        } else if (
          startChar === '(' ||
          startChar === ')' ||
          startChar === '+' ||
          startChar === '-' ||
          startChar === '*' ||
          startChar === '/' ||
          startChar === '%'
        ) {
          endIndex = startIndex + 1;
        }
      } else {
        throw Error(
          'Unable to parse statement: ' +
            data +
            ', char: ' +
            startChar +
            ', index: ' +
            startIndex
        );
      }

      tokens.push(trimmed.substring(startIndex, endIndex));
      startIndex = endIndex;

      if (startIndex >= trimmed.length) {
        done = true;
      }

      if (iterations++ > 1000) {
        throw Error(
          'Maximum number of parsing iterations reached, there is a syntax error here: ' +
            data
        );
      }
    }

    let condString = '';
    for (let i = 0; i < tokens.length; i++) {
      let token = tokens[i];
      condString += this.getSymbolForToken(token);
    }

    return condString;
  }

  private isFunctionToken(token: string): boolean {
    for (let i = 0; i < this.customFunctions.length; i++) {
      let functionName = this.customFunctions[i];
      if (token.startsWith(functionName)) {
        return true;
      }
    }
    return false;
  }

  private isStatementToken(token: string): boolean {
    return (
      this.isFunctionToken(token) &&
      !token.includes('(') &&
      !token.includes(')')
    );
  }

  private static getFunctionArgs(argString: string): string[] {
    let trimmed = argString.replace(/\s/g, '');

    let res: string[] = [];
    let startIndex = 0;
    let numBrackets = 0;
    for (let i = startIndex; i < trimmed.length; i++) {
      let char = trimmed[i];
      if (char === Symbols.BRACKET_OPEN) {
        numBrackets++;
      } else if (char === Symbols.BRACKET_CLOSE) {
        numBrackets--;
        if (numBrackets === 0 && i === trimmed.length - 1) {
          res.push(trimmed.substring(startIndex, i + 1));
        }
      } else if (char === Symbols.ARG_SEPARATOR || i === trimmed.length - 1) {
        // now we have reached the end of an argument
        if (numBrackets === 0) {
          let endIndex = i === trimmed.length - 1 ? i + 1 : i;
          res.push(trimmed.substring(startIndex, endIndex));
          startIndex = i + 1;
        }
      }
    }

    return res;
  }

  private parseFunctionToken(token: string): string {
    let funName = token.split('(')[0];
    let argString = CSL.getSubstringWithinBrackets(token);
    let args = CSL.getFunctionArgs(argString);
    let argSymbols = '';
    for (let i = 0; i < args.length; i++) {
      let arg = args[i];
      let symbol = this.getSymbolForToken(arg);
      argSymbols += symbol;
      if (i < args.length - 1) {
        argSymbols += ',';
      }
    }

    return `this.functions['${funName}'](${argSymbols})`;
  }

  private getSymbolForToken(token: string): string {
    if (CSL.isModelValue(token)) {
      if (token.length === 1) {
        return 'this.model';
      }
      return token.replace(Symbols.MODEL_PREFIX, 'this.model.');
    } else if (CSL.isStateValue(token)) {
      if (token.length === 1) {
        return 'this.state';
      }
      return token.replace(Symbols.STATE_PREFIX, 'this.state.');
    } else if (this.isStatementToken(token)) {
      return `this.functions['${token}'](this.model,this.state)`;
    } else if (this.isFunctionToken(token)) {
      return this.parseFunctionToken(token);
    } else if (CSL.isString(token)) {
      return token;
    } else if (CSL.isNumberString(token)) {
      return token;
    } else {
      // map to ts syntax
      switch (token) {
        case Symbols.LESS:
          return '<';
        case Symbols.LESS_EQUAL:
          return '<=';
        case Symbols.EQUAL:
          return '==';
        case Symbols.NOT_EQUAL:
          return '!=';
        case Symbols.GREATER_EQUAL:
          return '>=';
        case Symbols.GREATER:
          return '>';
        case Symbols.PLUS:
          return '+';
        case Symbols.MINUS:
          return '-';
        case Symbols.TIMES:
          return '*';
        case Symbols.DIV:
          return '/';
        case Symbols.MOD:
          return '%';
        case Symbols.BRACKET_OPEN:
          return '(';
        case Symbols.BRACKET_CLOSE:
          return ')';
        case Symbols.AND:
          return '&&';
        case Symbols.OR:
          return '||';
        default:
          return '';
      }
    }
  }

  getMessage<M, S>(
    msgString: string,
    model: M,
    state: S,
    functions: {[key: string]: Function}
  ): string {
    let message = msgString.slice();
    let tokens = this.getMessageTokens(message);

    let modelKeys = this.getFilteredTokenArray(tokens, Symbols.MODEL_PREFIX);
    let stateKeys = this.getFilteredTokenArray(tokens, Symbols.STATE_PREFIX);

    for (let i = 0; i < modelKeys.length; i++) {
      let modelKey = modelKeys[i];
      let modelKeyWithPrefix = Symbols.MODEL_PREFIX + modelKey;
      message = message.replace(
        modelKeyWithPrefix,
        CSL.getObjectValue(model, modelKey)
      );
    }

    for (let i = 0; i < stateKeys.length; i++) {
      let stateKey = stateKeys[i];
      let stateKeyWithPrefix = Symbols.STATE_PREFIX + stateKey;
      message = message.replace(
        stateKeyWithPrefix,
        CSL.getObjectValue(state, stateKey)
      );
    }

    for (let i = 0; i < tokens.length; i++) {
      let token = tokens[i];
      if (this.isStatementToken(token)) {
        let statementValue = functions[token](model, state);
        message = message.replace(token, statementValue);
      } else if (this.isFunctionToken(token)) {
        let functionValue = this.evaluateFunction(
          token,
          model,
          state,
          functions
        );
        message = message.replace(token, functionValue);
      }
    }

    return message;
  }

  private evaluateFunction<M, S>(
    token: string,
    model: M,
    state: S,
    functions: {[key: string]: Function}
  ): any {
    let stringRegex = new RegExp('\\' + Symbols.STRING_SYMBOL, 'g');
    let functionName = token.split('(')[0];
    let functionArgs = CSL.getSubstringWithinBrackets(token);
    let argsStrings = CSL.getFunctionArgs(functionArgs);
    let args: any[] = [];
    for (let i = 0; i < argsStrings.length; i++) {
      let argsString = argsStrings[i];
      if (this.isStatementToken(argsString)) {
        args.push(functions[argsString](model, state));
      } else if (this.isFunctionToken(argsString)) {
        args.push(this.evaluateFunction(argsString, model, state, functions));
      } else if (CSL.isModelValue(argsString)) {
        if (argsString.length === 1) {
          args.push(model);
        } else {
          args.push(
            CSL.getObjectValue(
              model,
              argsString.replace(Symbols.MODEL_PREFIX, '')
            )
          );
        }
      } else if (CSL.isStateValue(argsString)) {
        if (argsString.length === 1) {
          args.push(state);
        } else {
          args.push(
            CSL.getObjectValue(
              state,
              argsString.replace(Symbols.STATE_PREFIX, '')
            )
          );
        }
      } else if (CSL.isString(argsString)) {
        args.push(argsString.replace(stringRegex, ''));
      } else if (CSL.isNumberString(argsString)) {
        args.push(Number.parseFloat(argsString));
      }
    }

    return functions[functionName](...args);
  }

  private getFilteredTokenArray(
    tokens: string[],
    tokenPrefix: string
  ): string[] {
    return tokens
      .filter(token => token.startsWith(tokenPrefix))
      .map(token => token.replace(tokenPrefix, ''));
  }
}
