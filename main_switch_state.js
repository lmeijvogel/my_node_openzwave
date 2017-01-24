'use strict';

function MainSwitchState(redis) {
  let _switchEnabled = true;

  function switchEnabled() {
    return _switchEnabled;
  }

  function disableSwitch() {
    _switchEnabled = false;
    redis.set('zwave_switch_enabled', false);
  }

  function enableSwitch() {
    _switchEnabled = true;
    redis.set('zwave_switch_enabled', true);
  }

  return {
    switchEnabled:           switchEnabled,
    enableSwitch:            enableSwitch,
    disableSwitch:           disableSwitch,
  };

}

module.exports = MainSwitchState;
