'use strict';

const assert = require('assert');

const StateMachineBuilder = require('../state_machine_builder');
const TimeStateMachine = require('../time_state_machine');

describe('StateMachineBuilder', function () {
  describe('call', function () {
    let existingProgrammes = {
      off: {},
      evening: {},
      morning: {},
      dimmed: {},
      tree: {}
    };

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

      const result = StateMachineBuilder(transitions, existingProgrammes).call();

      const eveningTSMachine = new TimeStateMachine({
        on: {
          default: 'evening',
          evening: 'dimmed'
        },
        off: {
          default: 'tree',
          tree: 'off'
        }
      });

      assert.deepEqual(eveningTSMachine._getTransitions(), result.evening._getTransitions());
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

      const result = StateMachineBuilder(transitions, existingProgrammes).call();

      const eveningTSMachine = new TimeStateMachine({
        on: {
          default: 'evening'
        },
        off: {
          default: 'off'
        }
      });

      const morningTSMachine = new TimeStateMachine({
        on: {
          default: 'morning'
        },
        off: {
          default: 'off'
        }
      });

      assert.deepEqual(morningTSMachine._getTransitions(), result.morning._getTransitions());
      assert.deepEqual(eveningTSMachine._getTransitions(), result.evening._getTransitions());
    });

    context('when there is no "off" programme', function () {
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

        assert.throws(function () {
          StateMachineBuilder(transitions, {morning: {}, evening: {}}).call();
        }, /programme named 'off' should be defined/);
      });
    });

    context('when an unknown source programme name is specified', function () {
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
          StateMachineBuilder(transitions, existingProgrammes).call();
        }, /programme 'nonexistent' not found/);
      });
    });

    context('when an unknown target programme name is specified', function () {
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
          StateMachineBuilder(transitions, existingProgrammes).call();
        }, /programme 'nonexistent' not found/);
      });
    });
  });
});
