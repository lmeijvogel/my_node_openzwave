import * as assert from 'assert';
import * as sinon from 'sinon';
import { Programme } from '../Programme';
import { MyZWave } from '../MyZWave';
import { FakeZWave } from '../FakeZWave';
import { Light } from '../Light';

const lightId1 = 12;
const lightId2 = 13;
const lightId3 = 14;

const lightName1 = 'lightDimmer';
const lightName2 = 'lightSwitch1';
const lightName3 = 'lightSwitch2';

let intensity1 = 99;

let lights = new Map<string, Light>();

let programme = new Programme('name', 'displayName', new Map<string, any>(), lights);

let zwave = new MyZWave(new FakeZWave());

let zwaveMock = sinon.mock(zwave);

describe('Programme', function () {
  beforeEach(function () {

    intensity1 = 99;

    lights = new Map<string, Light>();

    lights.set(lightName1, {id: lightId1, displayName: 'light'});
    lights.set(lightName2, {id: lightId2, displayName: 'light'});
    lights.set(lightName3, {id: lightId3, displayName: 'light'});

    const data = new Map<string, any>();

    data.set(lightName1, intensity1);
    data.set(lightName2, false);
    data.set(lightName3, true);

    programme = new Programme('name', 'displayName', data, lights);
    zwave = new MyZWave(new FakeZWave());
    zwaveMock = sinon.mock(zwave);
  });

  describe('when it is built', function () {
    it('fails if any light name does not exist', function () {
      const lightValues = new Map<string, any>();

      lightValues.set('nonexistent', 12);

      const lights = new Map<string, Light>();

      assert.throws(function () {
        programme = new Programme('name', 'displayName', lightValues, lights);
      }, /node "nonexistent" does not exist/);
    });
  });

  describe('when it is applied', function () {
    it('applies all settings', function () {
      zwaveMock.expects('setLevel').withArgs(lightId1, intensity1);
      zwaveMock.expects('switchOff').withArgs(lightId2);
      zwaveMock.expects('switchOn').withArgs(lightId3);
      programme.apply(zwave);

      zwaveMock.verify();
    });
  });
});
