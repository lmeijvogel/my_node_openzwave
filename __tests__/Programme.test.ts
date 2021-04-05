import * as assert from 'assert';
import * as sinon from 'sinon';
import { Programme } from '../Programme';
import { MyZWave } from '../MyZWave';
import { FakeZWave } from '../FakeZWave';
import { ConfigLight } from '../ConfigLight';

const lightId1 = 12;
const lightId2 = 13;
const lightId3 = 14;

const lightDimmerName = 'lightDimmer';
const lightSwitchName1 = 'lightSwitch1';
const lightSwitchName2 = 'lightSwitch2';

let intensity1 = 99;

let zwave = new MyZWave(new FakeZWave());

let zwaveMock = sinon.mock(zwave);

let programme: IProgramme | null = null;

describe('Programme', () => {
  beforeEach(() => {
    intensity1 = 99;

    const lights = [
      {id: lightId1, name: lightDimmerName, displayName: 'lightDimmer', values: []},
      {id: lightId2, name: lightSwitchName1, displayName: 'lightSwitch1', values: []},
      {id: lightId3, name: lightSwitchName2, displayName: 'lightSwitch2', values: []}
    ];

    programme = new Programme('someProgramme', 'Some Programme', new Map<string, object>(), lights);

    const data = new Map<string, any>();

    data.set(lightDimmerName, intensity1);
    data.set(lightSwitchName1, false);
    data.set(lightSwitchName2, true);

    programme = new Programme('name', 'displayName', data, lights);
    zwave = new MyZWave(new FakeZWave());
    zwaveMock = sinon.mock(zwave);
  });

  describe('when it is built', () => {
    it('fails if any light name does not exist', () => {
      const lightValues = new Map<string, any>();

      lightValues.set('nonexistent', 12);

      const lights: ConfigLight[] = [];

      assert.throws(() => {
        programme = new Programme('name', 'displayName', lightValues, lights);
      }, /node "nonexistent" does not exist/);
    });
  });

  describe('when it is applied', () => {
    it('applies all settings', () => {
      zwaveMock.expects('setLevel').withArgs(lightId1, intensity1);
      zwaveMock.expects('switchOff').withArgs(lightId2);
      zwaveMock.expects('switchOn').withArgs(lightId3);
      programme.apply(zwave);

      zwaveMock.verify();
    });
  });
});
