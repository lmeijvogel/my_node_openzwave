Logger = require('./logger')

class ZWaveFactory
  constructor: (@testMode) ->

  create: ->
    if @testMode
      Logger.info("ZWaveFactory: Creating Fake ZWave")
      FakeZWave = require("./fake_zwave")
      new FakeZWave()
    else
      Logger.verbose("ZWaveFactory: Creating real ZWave")
      OpenZWave = require("openzwave")
      new OpenZWave("/dev/ttyUSB0",
        saveconfig: true
        retrytimeout: 3000
      )

module.exports = ZWaveFactory
