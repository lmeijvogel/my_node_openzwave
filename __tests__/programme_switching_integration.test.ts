import * as assert from "assert";
import { Node } from "../node";

import { objectToNestedMap } from "./objectToNestedMap";
import { objectToMap } from "./objectToNestedMap";
import { NextProgrammeChooser } from "../next_programme_chooser";
import { TimeStateMachine } from "../time_state_machine";
import { MockTimeService } from "./mock_time_service";
import { EventProcessor } from "../event_processor";
import { IProgramme } from "../programme";

import { IMyZWave } from "../imy_zwave";

class MockProgramme implements IProgramme {
  public readonly name: string;
  private readonly onApply: Function;

  constructor(name, onApply: Function) {
    this.name = name;
    this.onApply = onApply;
  }

  apply(zwave) {
    this.onApply(this);
  }
}

class MyFakeZWave implements IMyZWave {
  private handler: any;

  onNodeEvent(h) {
    this.handler = h;
  }

  registerEvents() {}
  connect() {}
  disconnect() {}
  onValueChange() {}
  addNode(nodeid: any) {}
  nodeReady() {}
  enablePoll() {}
  setLevel() {}
  switchOn() {}
  switchOff() {}
  healNetwork() {}

  nodes: [];
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
        on: {
          evening: "dimmed",
          default: "evening"
        },

        off: {
          default: "off"
        }
      })
    )
  });

  var programme = "boe";
  let programmes: IProgramme[] = [];

  ["evening", "tree", "dimmed", "off"].forEach(function(name) {
    const mockProgramme = new MockProgramme(name, zwave => {
      programme = name;
    });
    programmes.push(mockProgramme);
  });

  let nextProgrammeChooser, eventProcessor;

  beforeEach(function() {
    nextProgrammeChooser = new NextProgrammeChooser(timeService, stateMachines);

    eventProcessor = new EventProcessor(myZWave, programmes, nextProgrammeChooser);

    myZWave.onNodeEvent(function(node, event) {
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

      myZWave.onNodeEvent(function(node, event) {
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
