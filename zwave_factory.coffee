classy = require("classy")
ZWaveFactory = classy.define(
  init: (testMode) ->
    @testMode = testMode
    return

  create: ->
    if @testMode
      FakeZWave = require("./fake_zwave")
      new FakeZWave()
    else
      OpenZWave = require("openzwave")
      new OpenZWave("/dev/ttyUSB0",
        saveconfig: true
      )
)
module.exports = ZWaveFactory
