import ConstraintSystem from "../ConstraintSystem";
import ConstraintSystemPlugin from "../ConstraintSystemPlugin";

type Model = {
    time: string
    maxLength: number
};
type State = {
    currentTime: string
};

const model: Model = {
    time: "5:00",
    maxLength: 4
};
const state: State = {
    currentTime: "7:00"
}

test('ConstraintSystem Test', async () => {
    class Plugin extends ConstraintSystemPlugin<Model, State> {
        async registerConstraints(system: ConstraintSystem<Model, State>): Promise<void> {
            system.addConstraint({
                assertion: "ALWAYS: LENGTH($time) && LENGTH(#currentTime) && LENGTH('Test') < $maxLength",
                message: "failed0"
            });
            system.addConstraint({
                assertion: "WHEN(LENGTH('Test') == 4): LENGTH($time) - LENGTH(#currentTime) == ZERO",
                message: "failed1"
            });
        }

        async registerFunctions(system: ConstraintSystem<Model, State>): Promise<void> {
            system.addFunction("LENGTH", (string: string) => { return string.length });
            system.addStatement("ZERO", () => { return 0 });
            expect(() => {
                system.addStatement("ZERO", () => { return 0 })
            }).toThrowError();

            const model: Model = {
                time: "1:00",
                maxLength: 10
            };
            const state: State = {
                currentTime: "4:00"
            }
            expect(system.getMessage("ZERO", model, state)).toBe("0");
            expect(system.getMessage("$time", model, state)).toBe("1:00");
            expect(system.getMessage("#currentTime", model, state)).toBe("4:00");
            expect(system.getMessage("Length is LENGTH($time), is it?", model, state))
                .toBe("Length is 4, is it?");
            expect(system.getMessage("Length is LENGTH('Four'), is it?", model, state))
                .toBe("Length is 4, is it?");
            expect(system.getMessage("Length is 4.5, is it?", model, state))
                .toBe("Length is 4.5, is it?");
        }
    }

    const plugin = new Plugin();
    await plugin.init();
    const evaluation = plugin.evaluate(model, state);
    expect(evaluation.length).toBe(1);
    const instance = evaluation[0];
    expect(instance.message).toBe("failed0");
    expect(instance.consistent).toBe(false);
});
