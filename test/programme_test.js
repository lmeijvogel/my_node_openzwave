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

    lights[lightName1] = {id: lightId1, displayName: 'light'};
    lights[lightName2] = {id: lightId2, displayName: 'light'};
    lights[lightName3] = {id: lightId3, displayName: 'light'};

    data = {};

    data[lightName1] = intensity1;
    data[lightName2] = false;
    data[lightName3] = true;

    programme = new Programme('name', 'displayName', data, lights);
    zwave = MyZWave();
    zwaveMock = sinon.mock(zwave);
  });

  context('when it is built', function () {
    it('fails if any light name does not exist', function () {
      const lightValues = {
        nonexistent: 12
      };

      const lights = [];

      assert.throws(function () {
        programme = new Programme('name', 'displayName', lightValues, lights);
      }, /node "nonexistent" does not exist/);
    });
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
