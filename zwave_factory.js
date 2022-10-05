'use strict';

const Logger = require('./logger');

function ZWaveFactory(testMode) {
  function create() {
    if (testMode) {
      Logger.info('ZWaveFactory: Creating Fake ZWave');
      const FakeZWave = require('./fake_zwave');

      return new FakeZWave();
    } else {
      Logger.verbose('ZWaveFactory: Creating real ZWave');

      const OpenZWave = require('openzwave-shared');

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
