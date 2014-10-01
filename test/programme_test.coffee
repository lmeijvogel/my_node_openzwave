assert = require("assert")
sinon = require("sinon")
Programme = require("../programme")
MyZWave = require("../my_zwave")

describe "Programme", ->
  beforeEach ->
    @lightId1 = 12
    @lightId2 = 13
    @lightId3 = 14

    @lightName1 = "lightDimmer"
    @lightName2 = "lightSwitch1"
    @lightName3 = "lightSwitch2"

    @intensity1 = 99

    lights = {}

    lights[@lightName1] = @lightId1
    lights[@lightName2] = @lightId2
    lights[@lightName3] = @lightId3

    data = {}
    data[@lightName1] = @intensity1
    data[@lightName2] = false
    data[@lightName3] = true

    @programme = new Programme("name", data, lights)
    @zwave = new MyZWave()
    @zwaveMock = sinon.mock(@zwave)

  context "when it is applied", ->
    it "applies all settings", ->
      @zwaveMock.expects("setLevel").withArgs @lightId1, @intensity1
      @zwaveMock.expects("switchOff").withArgs @lightId2
      @zwaveMock.expects("switchOn").withArgs @lightId3
      @programme.apply @zwave

      @zwaveMock.verify()
