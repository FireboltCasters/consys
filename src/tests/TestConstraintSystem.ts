import * as ConSys from '../index';
import Config from '../Config';
import {ConstraintData} from '../Util';

type Model = {
  time: string;
  maxLength: number;
  nested: {
    value: number;
  };
  fun: () => any;
};
type State = {
  currentTime: string;
};

const model: Model = {
  time: '5:00',
  maxLength: 4,
  nested: {
    value: 42,
  },
  fun: () => {
    console.log('This should not be callable');
    return true;
  },
};
const state: State = {
  currentTime: '7:00',
};
const constraintData = [
  {
    constraint:
      "ALWAYS: LENGTH($time) && LENGTH(#currentTime) && LENGTH('Test') < $maxLength",
    message: 'failed0',
    id: 0,
  },
  {
    constraint:
      "WHEN(LENGTH('Test') == 4): LENGTH($time) - LENGTH(#currentTime) == ZERO",
    message: 'failed1',
    id: 1,
  },
  {
    constraint: 'ALWAYS: ZERO <= LENGTH($time)',
    message: 'failed',
  },
  {
    constraint: "ALWAYS: $time == '5:00'",
    message: 'failed2',
    id: 2,
  },
  {
    constraint: 'ALWAYS: $nested.value > 40',
    message: 'failed2',
    id: 2,
  },
  {
    constraint:
      "ALWAYS: (1.3 < 1.5 && 3 <= 3) || (4.5 == 4.5 && 3 != 4) || !(LENGTH('Test') >= LENGTH('Test')) || (2 > 1)",
  },
  {
    constraint:
      'ALWAYS: ((2 + 3) * (4 / 2)) % 2 == 0 && (ADD(1, ADD(1, ADD(1, 1))) == $maxLength)',
  },
];

const myConstraint = {
  constraint: 'ALWAYS: SUB(4, 2) == 2 && PRINT_OBJECT($) && PRINT_OBJECT(#)',
};

class MyPlugin extends ConSys.Plugin<Model, State> {
  async registerConstraints(
    system: ConSys.ConstraintSystem<Model, State>
  ): Promise<void> {
    system.addConstraint(myConstraint);
  }

  async registerFunctions(
    system: ConSys.ConstraintSystem<Model, State>
  ): Promise<void> {
    system.addFunction('SUB', (a: number, b: number) => {
      return a - b;
    });
    system.addFunction('PRINT_OBJECT', (object: any) => {
      console.log(object);
      return true;
    });
    system.addStatement('TRUE', () => true);
    system.addStatement('FALSE', () => false);
  }
}

/**
 * Testing all constraint system functions.
 */
test('ConstraintSystem behaves as expected', async () => {
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
      system.addConstraints(constraintData);
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
      system.addStatement('MODEL_CHECK', (model: Model) => {
        return model.maxLength === 10;
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
        nested: {
          value: 42,
        },
        fun: () => {
          console.log('This should not be callable');
          return true;
        },
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
      expect(
        system.getMessage('Length is ADD(3, ADD(2, 1)), is it?', model, state)
      ).toBe('Length is 6, is it?');
      expect(system.getMessage('$', model, state)).toBe(JSON.stringify(model));
      expect(system.getMessage('$unknown', model, state)).toBe('false');
      expect(system.getMessage('$tim!e', model, state)).toBe('false!e');
      expect(system.getMessage(',$maxLength, right?', model, state)).toBe(
        ',10, right?'
      );
      expect(system.getMessage('a$maxLength,', model, state)).toBe('a10,');
      expect(system.getMessage(',#currentTime,', model, state)).toBe(',4:00,');
      expect(system.getMessage('a#currentTime,', model, state)).toBe('a4:00,');
      expect(
        system.getMessage(
          "%$maxLength~#currentTime,LENGTH('Four')!ZERO@$nested.value%",
          model,
          state
        )
      ).toBe('%10~4:00,4!0@42%');
      expect(
        system.getMessage('(Test*ADD(ADD(3,10), ZERO)/Test', model, state)
      ).toBe('(Test*13/Test');
      expect(
        system.getMessage(
          "LENGTH('Test')? or $maxLength:LENGTH(#currentTime)",
          model,
          state
        )
      ).toBe('4? or 10:4');
    }
  }

  const system = new ConSys.ConstraintSystem();

  Config.DEBUG_LOG = false;
  await system.registerPlugin(new Plugin());

  Config.DEBUG_LOG = false;
  await system.registerPlugin(new MyPlugin());

  const report0 = system.evaluate([model], state, 'inconsistent');
  const report1 = system.evaluate(model, state, 'consistent');
  const report2 = system.evaluate(model, state, 'all');
  const report3 = system.evaluate(model, state, resource => resource.id === 0);
  const report4 = system.evaluate(model, state);

  expect(system.getNumInconsistentConstraints(model, state)).toBe(1);
  expect(system.getNumConsistentConstraints(model, state)).toBe(7);
  expect(system.getNumConstraints()).toBe(8);

  expect(report0[0].evaluation.length).toBe(1);
  expect(report1[0].evaluation.length).toBe(7);
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

  let statistics = system.evaluateStatistics(model, state);
  expect(statistics.totalConstraints).toBe(8);
  expect(statistics.consistent.total).toBe(7);
  expect(statistics.inconsistent.total).toBe(1);

  const constraint0 = {
    constraint: 'TRUE: FALSE',
    message: '$',
  };

  system.addConstraint(constraint0);
  let rep = system.evaluate(model, state, (resource: ConstraintData) => {
    return resource.constraint === 'TRUE: FALSE';
  });
  expect(rep[0].evaluation.length).toBe(1);
  expect(rep[0].evaluation[0].message).toBe(JSON.stringify(model));

  expect(() =>
    system.addConstraint({
      constraint: '',
    })
  ).toThrowError();

  expect(() =>
    system.addConstraint({
      constraint: 'ALWAYS: (3 * 3) =- 9',
    })
  ).toThrowError();

  expect(() =>
    system.addConstraint({
      constraint: 'ALWAYS: ((3 * 3)()3 + 3) == 4',
    })
  ).toThrowError();

  expect(() =>
    system.addConstraint({
      constraint: 'ALWAYS: ((3 * 3) == 9',
    })
  ).toThrowError();

  system.addConstraint({
    constraint: 'ALWAYS: MODEL_CHECK()',
  });

  expect(() =>
    system.addConstraint({
      constraint: ': MODEL_CHECK()',
    })
  ).toThrowError();

  expect(() =>
    system.addConstraint({
      constraint: 'ALWAYS: 4 * 3 == 5x',
    })
  ).toThrowError();

  expect(() =>
    system.addConstraint({
      constraint: 'ALWAYS: 4 * 3 &@ 12',
    })
  ).toThrowError();
});
