import * as assert from "assert";
import { Node } from "../Node";

import { objectToNestedMap } from "./objectToNestedMap";
import { objectToMap } from "./objectToNestedMap";
import { NextProgrammeChooser } from "../NextProgrammeChooser";
import { TimeStateMachine } from "../TimeStateMachine";
import { SwitchPressName } from "../SwitchPressName";
import { MockTimeService } from "./MockTimeService";
import { EventProcessor } from "../EventProcessor";
import { IProgramme } from "../Programme";

import { NodeEventHandler, ValueChangeEventHandler } from "../IMyZWave";

import { IMyZWave } from "../IMyZWave";

class MockProgramme implements IProgramme {
  constructor(readonly name: string, private readonly onApply: Function) {
  }

  apply(_zwave: any) {
    this.onApply(this);
  }
}

class MyFakeZWave implements IMyZWave {
  onNodeEvent(_h: NodeEventHandler) {}

  registerEvents() {}
  connect() {}
  disconnect() {}
  onValueChange(_h: ValueChangeEventHandler) {}
  addNode(_nodeid: any) {}
  nodeReady() {}
  enablePoll() {}
  setLevel() {}
  switchOn() {}
  switchOff() {}
  healNetwork() {}

  nodes: Node[];
}

describe("integration", function() {
  let handler;

  const myZWave = new MyFakeZWave();

  const timeService = new MockTimeService("evening", new Date());

  const switchOff = function() {
    handler.call(myZWave, new Node(3), 0);
  };

  const switchOn = function() {
    handler.call(myZWave, new Node(3), 255);
  };

  const stateMachines = objectToMap<TimeStateMachine>({
    evening: new TimeStateMachine(
      objectToNestedMap({
        [SwitchPressName.SingleOn]: {
          evening: "dimmed",
          default: "evening"
        },

        [SwitchPressName.SingleOff]: {
          default: "off"
        }
      })
    )
  });

  var programme = "boe";
  let programmes: IProgramme[] = [];

  ["evening", "tree", "dimmed", "off"].forEach(function(name) {
    const mockProgramme = new MockProgramme(name, _zwave => {
      programme = name;
    });
    programmes.push(mockProgramme);
  });

  let nextProgrammeChooser, eventProcessor;

  beforeEach(function() {
    nextProgrammeChooser = new NextProgrammeChooser(timeService, stateMachines);

    eventProcessor = new EventProcessor(myZWave, programmes, nextProgrammeChooser);

    myZWave.onNodeEvent(function(_node, event) {
      eventProcessor.mainSwitchPressed(event, programme);
    });
  });

  describe("when switching the lights off and on", function() {
    it('ends up in "evening" state', function() {
      switchOff();
      assert.equal(programme, "off");

      switchOn();
      assert.equal(programme, "evening");
    });
  });

  describe("when alternating between programmes", function() {
    it("works", function() {
      switchOff();
      assert.equal(programme, "off");

      switchOn();
      assert.equal(programme, "evening");

      switchOn();
      assert.equal(programme, "dimmed");

      switchOn();
      assert.equal(programme, "evening");
    });
  });

  describe('when there are multiple "off" steps', function() {
    const stateMachines = objectToMap<TimeStateMachine>({
      evening: new TimeStateMachine(
        objectToNestedMap({
          on: {
            default: "evening"
          },

          off: {
            default: "tree",
            tree: "off"
          }
        })
      )
    });

    beforeEach(function() {
      nextProgrammeChooser = new NextProgrammeChooser(timeService, stateMachines);

      eventProcessor = new EventProcessor(myZWave, programmes, nextProgrammeChooser);

      myZWave.onNodeEvent(function(_node, event) {
        eventProcessor.mainSwitchPressed(event, programme);
      });
    });

    it("traverses all steps", function() {
      switchOn();

      switchOff();
      assert.equal(programme, "tree");

      switchOff();
      assert.equal(programme, "off");
    });
  });
});
