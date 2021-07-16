import ConstraintSystem from '../ConstraintSystem';
import ConstraintSystemPlugin from '../ConstraintSystemPlugin';

test('ConstraintSystem Test', async () => {
  type Model = {
    time: string;
    maxLength: number;
  };
  type State = {
    currentTime: string;
  };
  class Plugin extends ConstraintSystemPlugin<Model, State> {
    async registerConstraints(
      system: ConstraintSystem<Model, State>
    ): Promise<void> {
      system.addConstraint({
        assertion: 'ALWAYS: LENGTH($time) && LENGTH(#currentTime) < $maxLength',
        message: 'failed',
      });
    }

    async registerFunctions(
      system: ConstraintSystem<Model, State>
    ): Promise<void> {
      system.addFunction('LENGTH', (string: string) => {
        return string.length;
      });
    }
  }

  const model: Model = {
    time: '5:00',
    maxLength: 4,
  };
  const state: State = {
    currentTime: '7:00',
  };
  const plugin = new Plugin();
  await plugin.init();
  const evaluation = plugin.evaluate(model, state);
  expect(evaluation.length).toBe(1);
  const instance = evaluation[0];
  expect(instance.message).toEqual('failed');
  expect(instance.consistent).toBe(false);
});
