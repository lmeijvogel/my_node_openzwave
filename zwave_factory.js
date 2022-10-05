'use strict';

const Logger    = require('./logger');
const OpenZWave = require('openzwave-shared');
const FakeZWave = require('./fake_zwave');

function ZWaveFactory(testMode) {
  function create() {
    // Always create real instance, even if it's not going to be used.
    // This makes sure that even in test mode, we can ascertain that the
    // the real library can be compiled correctly, which saves panic fixes at 24:00.
    const realZwave = new OpenZWave({
      SaveConfig: true,
      RetryTimeout: 3000
    });

    const fakeZWave = new FakeZWave();

    if (testMode) {
      Logger.info('ZWaveFactory: Creating Fake ZWave');

      return fakeZWave;
    } else {
      Logger.verbose('ZWaveFactory: Creating real ZWave');

      return realZwave;
    }
  }

  return {
    create: create
  };
}

module.exports = ZWaveFactory;
