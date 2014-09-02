var assert    = require('assert');
var sinon     = require('sinon');
var Programme = require('../programme');
var MyZWave   = require('../my_zwave');

describe("Programme", function() {
  beforeEach(function() {
    this.lightId1 = 12;
    this.lightId2 = 13;
    this.lightId3 = 14;
    this.lightName1 = "lightDimmer";
    this.lightName2 = "lightSwitch1";
    this.lightName3 = "lightSwitch2";
    this.intensity1 = 99;

    var lights = {}; lights[this.lightName1] = this.lightId1;
                     lights[this.lightName2] = this.lightId2;
                     lights[this.lightName3] = this.lightId3;
    var data   = {};   data[this.lightName1]  = this.intensity1;
                       data[this.lightName2]  = false;
                       data[this.lightName3]  = true;

    this.programme = new Programme("name", data, lights);

    this.zwave = new MyZWave();

    this.zwaveMock = sinon.mock(this.zwave);
  });

  context("when it is applied", function() {
    it("applies all settings", function() {
      this.zwaveMock.expects("setLevel").withArgs(this.lightId1, this.intensity1);
      this.zwaveMock.expects("switchOff").withArgs(this.lightId2);
      this.zwaveMock.expects("switchOn").withArgs(this.lightId3);

      this.programme.apply(this.zwave);

      this.zwaveMock.verify();
    });
  });
});
