function create(testMode) {
  if (testMode) {
    var fake_zwave = require('./fake_zwave');
    return new fake_zwave.FakeZWave();
  } else {
    var OpenZWave = require('openzwave');
    return new OpenZWave('/dev/ttyUSB0', {
      saveconfig: true,
    });
  }
};

exports.create = create;
