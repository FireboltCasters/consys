import ConstraintSystem from '../ConstraintSystem';
import ConstraintSystemPlugin from '../ConstraintSystemPlugin';

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

/**
 * Testing all constraint system functions.
 */
test('ConstraintSystem Test', async () => {
  const constraintData = [
    {
      assertion:
        "ALWAYS: LENGTH($time) && LENGTH(#currentTime) && LENGTH('Test') < $maxLength",
      message: 'failed0',
    },
    {
      assertion:
        "WHEN(LENGTH('Test') == 4): LENGTH($time) - LENGTH(#currentTime) == ZERO",
      message: 'failed1',
    },
    {
      assertion: "ALWAYS: $time == '5:00'",
      message: 'failed2',
    },
  ];

  /**
   * Custom constraint system plugin.
   */
  class Plugin extends ConstraintSystemPlugin<Model, State> {
    /**
     * Register the constraints defined above.
     *
     * @param system constraint system
     */
    async registerConstraints(
      system: ConstraintSystem<Model, State>
    ): Promise<void> {
      for (let data of constraintData) {
        system.addConstraint(data);
      }
    }

    /**
     * Register custom functions and statements.
     *
     * @param system constraint system
     */
    async registerFunctions(
      system: ConstraintSystem<Model, State>
    ): Promise<void> {
      system.addFunction('LENGTH', (string: string) => {
        return string.length;
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
    }
  }

  const plugin = new Plugin();
  await plugin.init();
  const report = plugin.evaluate([model], state);
  expect(report.length).toBe(1);
  const instance = report[0];
  expect(instance.checkedModel).toBe(model);
  expect(instance.checkedState).toBe(state);
  expect(JSON.stringify(instance.checkedConstraints)).toBe(
    JSON.stringify(constraintData)
  );
  const evaluations = instance.evaluation;
  expect(evaluations.length).toBe(1);
  const evaluation = evaluations[0];
  expect(evaluation.message).toBe('failed0');
  expect(evaluation.consistent).toBe(false);
});
