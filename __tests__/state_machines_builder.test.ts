import * as assert from 'assert';

import { objectToNestedMap } from './objectToNestedMap';

import { Programme } from '../programme';
import { Light } from '../light';
import { StateMachineBuilder } from '../state_machine_builder';
import { TimeStateMachine } from '../time_state_machine';
import { TimePeriod } from '../time_service';

describe('StateMachineBuilder', function () {
  describe('call', function () {
    let existingProgrammes = ['off', 'evening', 'morning', 'dimmed', 'tree'].map(name => buildProgramme(name));

    it('builds the expected TimeStateMachines', function () {
      const transitions = {
        evening: {
          on: {
            default: 'evening',
            evening: 'dimmed'
          },

          off: {
            default: 'tree',
            tree: 'off'
          }
        },

        morning: {
          on: {
            default: 'morning'
          }
        }
      };

      const result = new StateMachineBuilder(transitions, existingProgrammes).call();

      const eveningTSMachine = new TimeStateMachine(objectToNestedMap({
        on: {
          default: 'evening',
          evening: 'dimmed'
        },
        off: {
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

    it('sets a default "off" transition if it is not specified', function () {
      const transitions = {
        evening: {
          on: {
            default: 'evening'
          }
        },

        morning: {
          on: {
            default: 'morning'
          }
        }
      };

      const result = new StateMachineBuilder(transitions, existingProgrammes).call();

      const eveningTSMachine = new TimeStateMachine(objectToNestedMap({
        on: {
          default: 'evening'
        },
        off: {
          default: 'off'
        }
      }));

      const morningTSMachine = new TimeStateMachine(objectToNestedMap({
        on: {
          default: 'morning'
        },
        off: {
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

    describe('when there is no "off" programme', function () {
      it('throws an error', function () {
        const transitions = {
          evening: {
            on: {
              default: 'evening'
            }
          },

          morning: {
            on: {
              default: 'morning'
            }
          }
        };

        const programmes = ['morning', 'evening'].map(name => buildProgramme(name));

        assert.throws(function () {
          new StateMachineBuilder(transitions, programmes).call();
        }, /programme named 'off' should be defined/);
      });
    });

    describe('when an unknown source programme name is specified', function () {
      it('throws an error', function () {
        const transitions = {
          evening: {
            on: {
              nonexistent: 'evening'
            }
          },

          morning: {
            on: {
              default: 'morning'
            }
          }
        };

        assert.throws(function () {
          new StateMachineBuilder(transitions, existingProgrammes).call();
        }, /programme 'nonexistent' not found/);
      });
    });

    describe('when an unknown target programme name is specified', function () {
      it('throws an error', function () {
        const transitions = {
          evening: {
            on: {
              default: 'nonexistent'
            }
          },

          morning: {
            on: {
              default: 'morning'
            }
          }
        };

        assert.throws(function () {
          new StateMachineBuilder(transitions, existingProgrammes).call();
        }, /programme 'nonexistent' not found/);
      });
    });
  });
});

function buildProgramme(name) {
  return new Programme(name, name, new Map<string, any>(), new Map<string, Light>());
}
