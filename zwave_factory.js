'use strict';

var Logger = require('./logger');

function ZWaveFactory(testMode) {
  function create() {
    if (testMode) {
      Logger.info('ZWaveFactory: Creating Fake ZWave');
      var FakeZWave = require('./fake_zwave');

      return new FakeZWave();
    } else {
      Logger.verbose('ZWaveFactory: Creating real ZWave');

      var OpenZWave = require('openzwave-shared');

      return new OpenZWave({
        SaveConfig: true,
        RetryTimeout: 3000
      });
    }
  }

  return {
    create: create
  };
}

module.exports = ZWaveFactory;
