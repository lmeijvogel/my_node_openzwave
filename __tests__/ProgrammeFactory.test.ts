import * as assert from 'assert';
import * as sinon from 'sinon';
import { Programme } from '../Programme';
import { IProgramme } from '../Programme';
import { ConfigProgramme, ProgrammeFactory } from '../ProgrammeFactory';
import { ConfigLight } from '../ConfigLight';

const lightId1 = 12;
const lightId2 = 13;

const lightName1 = 'lightDimmer';
const lightName2 = 'lightSwitch';

let lights = [
    {id: lightId1, name: lightName1, displayName: lightName1, values: {}},
    {id: lightId2, name: lightName2, displayName: lightName2, values: {}}
];

let input = new Map<string, ConfigProgramme>();

input.set("off",{
  "displayName": "Uit",
  "values": {
    "lightDimmer":  0,
    "lightSwitch":  false
  }
});

input.set("morning", {
  "displayName": "Ochtend",
  "values": {
    "lightDimmer":  42,
    "lightSwitch":  true
  }
});

describe('ProgrammeFactory', function () {
  it('it builds programmes with the right values', function () {
    const programmeFactory = new ProgrammeFactory();

    const result : IProgramme[] = programmeFactory.build(input, lights);

    const offProgramme : Programme = <Programme>result[0];

    assert.equal('off', offProgramme.name);
    assert.equal('Uit', offProgramme.displayName);

    const offDimmerAction = offProgramme.actions[0];

    assert.equal('lightDimmer', offDimmerAction.nodeName);
    assert.equal(12, offDimmerAction.nodeId);
    assert.equal(0, offDimmerAction.value);

    const offSwitchAction = offProgramme.actions[1];

    assert.equal('lightSwitch', offSwitchAction.nodeName);
    assert.equal(13, offSwitchAction.nodeId);
    assert.equal(false, offSwitchAction.value);

    const morningProgramme = <Programme>result[1];

    assert.equal('morning', morningProgramme.name);
    assert.equal('Ochtend', morningProgramme.displayName);

    const morningDimmerAction = morningProgramme.actions[0];

    assert.equal('lightDimmer', morningDimmerAction.nodeName);
    assert.equal(12, morningDimmerAction.nodeId);
    assert.equal(42, morningDimmerAction.value);

    const morningSwitchAction = morningProgramme.actions[1];

    assert.equal('lightSwitch', morningSwitchAction.nodeName);
    assert.equal(13, morningSwitchAction.nodeId);
    assert.equal(true, morningSwitchAction.value);

  });
});
