'use strict';

const assert = require('assert');
const sinon = require('sinon');
const Programme = require('../programme');
const MyZWave = require('../my_zwave');

let lightId1 = null;
let lightId2 = null;
let lightId3 = null;

let lightName1 = null;
let lightName2 = null;
let lightName3 = null;

let intensity1 = null;

let lights = null;
let data = null;

let programme = null;
let zwave = null;
let zwaveMock = null;

describe('Programme', function () {
  beforeEach(function () {
    lightId1 = 12;
    lightId2 = 13;
    lightId3 = 14;

    lightName1 = 'lightDimmer';
    lightName2 = 'lightSwitch1';
    lightName3 = 'lightSwitch2';

    intensity1 = 99;

    lights = {};

    lights[lightName1] = lightId1;
    lights[lightName2] = lightId2;
    lights[lightName3] = lightId3;

    data = {};

    data[lightName1] = intensity1;
    data[lightName2] = false;
    data[lightName3] = true;

    programme = Programme('name', 'displayName', data, lights);
    zwave = MyZWave();
    zwaveMock = sinon.mock(zwave);
  });

  context('when it is applied', function () {
    it('applies all settings', function () {
      zwaveMock.expects('setLevel').withArgs(lightId1, intensity1);
      zwaveMock.expects('switchOff').withArgs(lightId2);
      zwaveMock.expects('switchOn').withArgs(lightId3);
      programme.apply(zwave);

      zwaveMock.verify();
    });
  });
});