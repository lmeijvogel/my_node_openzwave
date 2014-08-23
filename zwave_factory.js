var classy = require('classy');

var ZWaveFactory = classy.define({
  init: function(testMode) {
    this.testMode = testMode;
  },

  create: function() {
    if (this.testMode) {
      var FakeZWave = require('./fake_zwave');
      return new FakeZWave();
    } else {
      var OpenZWave = require('openzwave');
      return new OpenZWave('/dev/ttyUSB0', {
        saveconfig: true,
      });
    }
  }
});

module.exports = ZWaveFactory;
