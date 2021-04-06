import * as assert from "assert";
import { Node } from "../Node";
import * as winston from "winston";

import { objectToNestedMap } from "./objectToNestedMap";
import { objectToMap } from "./objectToNestedMap";
import { NextProgrammeChooser } from "../NextProgrammeChooser";
import { TimeStateMachine } from "../TimeStateMachine";
import { mainSceneIdToSwitchPressName, SwitchPressName } from "../SwitchPressName";
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
  private nodeEventHandler: NodeEventHandler | null = null;

  onNodeEvent(h: NodeEventHandler) { this.nodeEventHandler = h; }

  registerEvents() {}
  connect() {}
  disconnect() {}
  onValueChange(_h: ValueChangeEventHandler) {}
  addNode(_nodeid: any) {}
  nodeReady() {}
  enablePoll() {}
  setLevel() {}
  switchOn() { this.nodeEventHandler!(new Node(12), 10); }
  switchOff() { this.nodeEventHandler!(new Node(12), 11); }
  healNetwork() {}

  nodes: Node[] = [];
}

describe("integration", function() {
  const myZWave = new MyFakeZWave();

  const timeService = new MockTimeService("evening", new Date());

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

  var programme = "unknown";

  const programmes = ["evening", "tree", "dimmed", "off"].map(name =>
      new MockProgramme(name, (_zwave: IMyZWave) => { programme = name; })
  );

  let nextProgrammeChooser: NextProgrammeChooser, eventProcessor: EventProcessor;

  beforeEach(function() {
    nextProgrammeChooser = new NextProgrammeChooser(timeService, stateMachines);

    eventProcessor = new EventProcessor(myZWave, { programmes }, nextProgrammeChooser);

    myZWave.onNodeEvent(function(_node, event) {
      const switchPressName = mainSceneIdToSwitchPressName(event);

      eventProcessor.mainSwitchPressed(switchPressName, programme);
    });
  });

  describe("when switching the lights off and on", function() {
    it('ends up in "evening" state', function() {
      myZWave.switchOff();
      assert.equal(programme, "off");

      myZWave.switchOn();
      assert.equal(programme, "evening");
    });
  });

  describe("when alternating between programmes", function() {
    it("works", function() {
      myZWave.switchOff();
      assert.equal(programme, "off");

      myZWave.switchOn();
      assert.equal(programme, "evening");

      myZWave.switchOn();
      assert.equal(programme, "dimmed");

      myZWave.switchOn();
      assert.equal(programme, "evening");
    });
  });

  describe('when there are multiple "off" steps', function() {
    const stateMachines = objectToMap<TimeStateMachine>({
      evening: new TimeStateMachine(
        objectToNestedMap({
          [SwitchPressName.SingleOn]: {
            default: "evening"
          },

          [SwitchPressName.SingleOff]: {
            default: "tree",
            tree: "off"
          }
        })
      )
    });

    beforeEach(function() {
      nextProgrammeChooser = new NextProgrammeChooser(timeService, stateMachines);

      eventProcessor = new EventProcessor(myZWave, { programmes }, nextProgrammeChooser);

      myZWave.onNodeEvent(function(_node, event) {
        const switchPressName = mainSceneIdToSwitchPressName(event);

        eventProcessor.mainSwitchPressed(switchPressName, programme);
      });
    });

    it("traverses all steps", function() {
      myZWave.switchOn();
      assert.equal(programme, "evening");

      myZWave.switchOff();
      assert.equal(programme, "tree");

      myZWave.switchOff();
      assert.equal(programme, "off");
    });
  });
});
