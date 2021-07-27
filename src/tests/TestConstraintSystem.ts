import * as ConSys from '../index';
import Config from "../Config";

type Model = {
  time: string;
  maxLength: number;
};
type State = {
  currentTime: string;
};

const model: Model = {
  time: '5:00',
  maxLength: 4,
};
const state: State = {
  currentTime: '7:00',
};
const constraintData = [
  {
    assertion: "ALWAYS: LENGTH($time) && LENGTH(#currentTime) && LENGTH('Test') < $maxLength",
    message: 'failed0',
    id: 0
  },
  {
    assertion: "WHEN(LENGTH('Test') == 4): LENGTH($time) - LENGTH(#currentTime) == ZERO",
    message: 'failed1',
    id: 1
  },
  {
    assertion: "ALWAYS: $time == '5:00'",
    message: 'failed2',
    id: 2
  },
  {
    assertion: "ALWAYS: (1.3 < 1.5 && 3 <= 3) || (4.5 == 4.5 && 3 != 4) || !(LENGTH('Test') >= LENGTH('Test')) || (2 > 1)"
  },
  {
    assertion: "ALWAYS: ((2 + 3) * (4 / 2)) % 2 == 0 && (ADD(1, ADD(1, ADD(1, 1))) == $maxLength)"
  },
];

const myConstraint = {
  assertion: "ALWAYS: SUB(4, 2) == 2 && PRINT_OBJECT($)"
};

class MyPlugin extends ConSys.Plugin<Model, State> {
  async registerConstraints(system: ConSys.ConstraintSystem<Model, State>): Promise<void> {
    system.addConstraint(myConstraint);
  }

  async registerFunctions(system: ConSys.ConstraintSystem<Model, State>): Promise<void> {
    system.addFunction('SUB', (a: number, b: number) => {
      return a - b;
    });
    system.addFunction('PRINT_OBJECT', (object: any) => {
      console.log(object);
      return true;
    });
  }
}

/**
 * Testing all constraint system functions.
 */
test('ConstraintSystem Test', async () => {

  /**
   * Custom constraint system plugin.
   */
  class Plugin extends ConSys.Plugin<Model, State> {
    /**
     * Register the constraints defined above.
     *
     * @param system constraint system
     */
    async registerConstraints(
      system: ConSys.ConstraintSystem<Model, State>
    ): Promise<void> {
      for (let i = 0; i < constraintData.length; i++) {
        system.addConstraint(constraintData[i]);
      }
    }

    /**
     * Register custom functions and statements.
     *
     * @param system constraint system
     */
    async registerFunctions(
      system: ConSys.ConstraintSystem<Model, State>
    ): Promise<void> {
      system.addFunction('LENGTH', (string: string) => {
        return string.length;
      });
      system.addFunction('ADD', (a: number, b: number) => {
        return a + b;
      });
      system.addStatement('ZERO', () => {
        return 0;
      });
      expect(() => {
        system.addStatement('ZERO', () => {
          return 0;
        });
      }).toThrowError();

      const model: Model = {
        time: '1:00',
        maxLength: 10,
      };
      const state: State = {
        currentTime: '4:00',
      };
      expect(system.getMessage('ZERO', model, state)).toBe('0');
      expect(system.getMessage('$time', model, state)).toBe('1:00');
      expect(system.getMessage('#currentTime', model, state)).toBe('4:00');
      expect(
        system.getMessage('Length is LENGTH($time), is it?', model, state)
      ).toBe('Length is 4, is it?');
      expect(
        system.getMessage("Length is LENGTH('Four'), is it?", model, state)
      ).toBe('Length is 4, is it?');
      expect(system.getMessage('Length is 4.5, is it?', model, state)).toBe(
        'Length is 4.5, is it?'
      );
      expect(system.getMessage('Length is ZERO, is it?', model, state)).toBe(
          'Length is 0, is it?'
      );
      expect(system.getMessage('Length is ADD(3, ADD(2, 1)), is it?', model, state)).toBe(
          'Length is 6, is it?'
      );
      expect(system.getMessage('$', model, state)).toBe(
          JSON.stringify(model)
      );
      expect(system.getMessage('$unknown', model, state)).toBe("undefined");
      expect(system.getMessage('$tim!e', model, state)).toBe("undefined");
    }
  }

  const system = new ConSys.ConstraintSystem();

  Config.DEBUG_LOG = false;
  await system.registerPlugin(new Plugin());

  Config.DEBUG_LOG = true;
  await system.registerPlugin(new MyPlugin());

  const report0 = system.evaluate([model], state, "inconsistent");
  const report1 = system.evaluate(model, state, "consistent");
  const report2 = system.evaluate(model, state, "all");
  const report3 = system.evaluate(model, state, (evaluation) => evaluation.resource.id === 0);
  const report4 = system.evaluate(model, state);

  expect(report0[0].evaluation.length).toBe(1);
  expect(report1[0].evaluation.length).toBe(5);
  expect(report2[0].evaluation.length).toBe(constraintData.length + 1);
  expect(report3[0].evaluation.length).toBe(1);
  expect(report4[0].evaluation.length).toBe(constraintData.length + 1);

  const instance = report0[0];

  expect(instance.checkedModel).toBe(model);
  expect(instance.checkedState).toBe(state);
  expect(JSON.stringify(instance.checkedConstraints)).toBe(
    JSON.stringify([...constraintData, myConstraint])
  );

  const evaluations = instance.evaluation;

  expect(evaluations.length).toBe(1);

  const evaluation = evaluations[0];

  expect(evaluation.message).toBe('failed0');
  expect(evaluation.consistent).toBe(false);
});
