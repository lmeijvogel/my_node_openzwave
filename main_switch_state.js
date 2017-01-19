'use strict';

function MainSwitchState(redis) {
  function switchDisabled() {
    redis.set('zwave_switch_enabled', false);
  }

  function switchEnabled() {
    redis.set('zwave_switch_enabled', true);
  }

  return {
    switchEnabled:            switchEnabled,
    switchDisabled:           switchDisabled,
  };

}

module.exports = MainSwitchState;
