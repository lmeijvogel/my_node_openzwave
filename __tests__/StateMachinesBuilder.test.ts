import * as assert from 'assert';

import { objectToNestedMap } from './objectToNestedMap';

import { Programme } from '../Programme';
import { Light } from '../Light';
import { SwitchPressName } from "../SwitchPressName";
import { StateMachineBuilder } from '../StateMachineBuilder';
import { TimeStateMachine } from '../TimeStateMachine';

describe('StateMachineBuilder', () => {
  describe('call', () => {
    let programmes = ['off', 'evening', 'morning', 'dimmed', 'tree'].map(name => buildProgramme(name));

    it('builds the expected TimeStateMachines', () => {
      const transitions = {
        evening: {
          [SwitchPressName.SingleOn]: {
            default: 'evening',
            evening: 'dimmed'
          },
          [SwitchPressName.  SingleOff]: {
            default: 'tree',
            tree: 'off'
          }
        },

        morning: {
          [SwitchPressName.SingleOn]: {
            default: 'morning'
          }
        }
      };

      const result = new StateMachineBuilder({ transitions, programmes }).call();

      const eveningTSMachine = new TimeStateMachine(objectToNestedMap({
        [SwitchPressName.SingleOn]: {
          default: 'evening',
          evening: 'dimmed'
        },
        [SwitchPressName.SingleOff]: {
          default: 'tree',
          tree: 'off'
        }
      }));

      const eveningResult = result.get('evening');
      if (eveningResult === undefined ) {
        assert.fail("eveningResult is null/undefined");
        return;
      }

      assert.deepEqual(eveningTSMachine._getTransitions(), eveningResult._getTransitions());
    });

    it('sets a default "off" transition if it is not specified', () => {
      const transitions = {
        evening: {
          [SwitchPressName.SingleOn]: {
            default: 'evening'
          }
        },

        morning: {
          [SwitchPressName.SingleOn]: {
            default: 'morning'
          }
        }
      };

      const result = new StateMachineBuilder({transitions, programmes}).call();

      const eveningTSMachine = new TimeStateMachine(objectToNestedMap({
        [SwitchPressName.SingleOn]: {
          default: 'evening'
        },
        [SwitchPressName.SingleOff]: {
          default: 'off'
        }
      }));

      const morningTSMachine = new TimeStateMachine(objectToNestedMap({
        [SwitchPressName.SingleOn]: {
          default: 'morning'
        },
        [SwitchPressName.SingleOff]: {
          default: 'off'
        }
      }));

      const morningResult = result.get('morning');
      if (morningResult === undefined ) {
        assert.fail("morningResult is null/undefined");
        return;
      }

      const eveningResult = result.get('evening');
      if (eveningResult === undefined ) {
        assert.fail("eveningResult is null/undefined");
        return;
      }

      assert.deepEqual(morningTSMachine._getTransitions(), morningResult._getTransitions());
      assert.deepEqual(eveningTSMachine._getTransitions(), eveningResult._getTransitions());
    });

    describe('when there is no "off" programme', () => {
      it('throws an error', () => {
        const transitions = {
          evening: {
            [SwitchPressName.SingleOn]: {
              default: 'evening'
            }
          },

          morning: {
            [SwitchPressName.SingleOn]: {
              default: 'morning'
            }
          }
        };

        const programmes = ['morning', 'evening'].map(name => buildProgramme(name));

        assert.throws(() => {
          new StateMachineBuilder({transitions, programmes}).call();
        }, /programme named 'off' should be defined/);
      });
    });

    describe('when an unknown source programme name is specified', () => {
      it('throws an error', () => {
        const transitions = {
          evening: {
            [SwitchPressName.SingleOn]: {
              nonexistent: 'evening'
            }
          },

          morning: {
            [SwitchPressName.SingleOn]: {
              default: 'morning'
            }
          }
        };

        assert.throws(() => {
          new StateMachineBuilder({transitions, programmes}).call();
        }, /programme 'nonexistent' not found/);
      });
    });

    describe('when an unknown target programme name is specified', () => {
      it('throws an error', () => {
        const transitions = {
          evening: {
            [SwitchPressName.SingleOn]: {
              default: 'nonexistent'
            }
          },

          morning: {
            [SwitchPressName.SingleOn]: {
              default: 'morning'
            }
          }
        };

        assert.throws(() => {
          new StateMachineBuilder({transitions, programmes}).call();
        }, /programme 'nonexistent' not found/);
      });
    });
  });
});

function buildProgramme(name: string) {
  return new Programme(name, name, new Map<string, any>(), new Map<string, Light>());
}
