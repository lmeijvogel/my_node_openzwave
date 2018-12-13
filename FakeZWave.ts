/*
 * This is for testing to see some feedback.

 * To make it possible to test interactions
 * without actually having to connect the ZWave
 * unit: Web requests can be used to simulate a
 * button press.

 * Node will never be ready since it is a battery powered
 * switch, reporting as little as possible.
 */

import { each } from "lodash";
import { Logger } from "./Logger";
import { IZWave } from "./IZWave";

const SWITCH_BINARY = 37;
const SWITCH_MULTILEVEL = 38;

class FakeZWave implements IZWave {
  callbacks: Object;
  nodes: Object;

  constructor() {
    this.callbacks = {};
    this.nodes = {};
  }

  on(eventName, callback) {
    if (!this.callbacks[eventName]) {
      this.callbacks[eventName] = [];
    }

    this.callbacks[eventName].push(callback);
  }

  connect() {
    const homeId = "128";

    this.emitEvent("driver ready", [homeId]);

    this.initializeDevices();

    this.emitEvent("scan complete");
    this.setNodeLevel(2, 99);

    this.setNodeLevel(5, 99);
    this.setNodeOn(7);
    this.setNodeLevel(8, 99);
    this.setNodeLevel(2, 0);
    this.setNodeLevel(5, 0);
    this.setNodeOff(7);
    this.setNodeLevel(8, 0);
  }

  disconnect() {}

  setNodeLevel(nodeId, level) {
    this.nodes[nodeId]["level"] = level;
    this.emitEvent("value changed", [
      nodeId,
      38,
      {
        label: "level",
        index: 0,
        value: level
      }
    ]);
  }

  setNodeOn(nodeId) {
    this.nodes[nodeId]["value"] = true;
    this.emitEvent("value changed", [
      nodeId,
      37,
      {
        label: "Switch",
        index: 0,
        value: true
      }
    ]);
  }

  setNodeOff(nodeId) {
    this.nodes[nodeId]["value"] = false;
    this.emitEvent("value changed", [
      nodeId,
      37,
      {
        label: "Switch",
        index: 0,
        value: false
      }
    ]);
  }

  refreshNodeInfo(nodeid) {
    Logger.info(`FAKE: RefreshNodeInfo ${nodeid}`);
  }

  healNetwork() {
    Logger.info("FAKE: HealNetwork");
  }

  enablePoll(nodeid, commandClass) {
    Logger.info(`FAKE: EnablePoll. nodeId ${nodeid}, commandClass: ${commandClass}`);
  }

  private initializeDevices() {
    this.nodes[2] = { level: 0 };
    this.nodes[3] = {};
    this.nodes[5] = { level: 0 };
    this.nodes[7] = { value: false };
    this.nodes[8] = { level: 0 };
    this.nodes[9] = { level: 0 };

    const node2NodeInfo = {
      manufacturer: "Aeon Labs",
      manufacturerid: "0086",
      product: "Smart Energy Illuminator",
      producttype: "0003",
      productid: "0008",
      type: "Multilevel Power Switch",
      name: "",
      loc: ""
    };

    // node 3 is never ready, since it is on battery and doesn't listen to events to save power
    // const node3_nodeinfo = {};

    const node5NodeInfo = {
      manufacturer: "FIBARO System",
      manufacturerid: "010f",
      product: "",
      producttype: "0100",
      productid: "100a",
      type: "Multilevel Power Switch",
      name: "",
      loc: ""
    };
    const node7NodeInfo = {
      manufacturer: "Z-Wave.Me",
      manufacturerid: "0115",
      product: "ZME_054313Z Flush-Mountable Switch",
      producttype: "1000",
      productid: "0001",
      type: "Binary Power Switch",
      name: "",
      loc: ""
    };

    const node8NodeInfo = {
      manufacturer: "Z-Wave.Me",
      manufacturerid: "0115",
      product: "ZME_06433 Wall Flush-Mountable Dimmer",
      producttype: "1000",
      productid: "0002",
      type: "Multilevel Power Switch",
      name: "",
      loc: ""
    };

    const node9NodeInfo = {
      manufacturer: "Aeon Labs",
      manufacturerid: "0086",
      product: "Smart Energy Illuminator",
      producttype: "0003",
      productid: "0008",
      type: "Multilevel Power Switch",
      name: "",
      loc: ""
    };

    this.emitEvent("node added", [2]);
    this.emitEvent("node added", [3]);
    this.emitEvent("node added", [5]);
    this.emitEvent("node added", [7]);
    this.emitEvent("node added", [8]);
    this.emitEvent("node added", [9]);
    const dimValue = {
      type: "byte",
      genre: "user",
      instance: 1,
      index: 0,
      label: "Level",
      units: "",
      read_only: false,
      write_only: false,
      min: 0,
      max: 255,
      value: 0
    };

    const switchValue = {
      type: "bool",
      genre: "user",
      instance: 1,
      index: 0,
      label: "Switch",
      units: "",
      read_only: false,
      write_only: false,
      min: 0,
      max: 0,
      value: false
    };

    const standaloneSwitchValue = {
      type: "byte",
      genre: "all",
      instance: 1,
      index: 0,
      label: "Basic",
      units: "",
      read_only: false,
      write_only: false,
      min: 0,
      max: 255,
      value: 0
    };

    this.emitEvent("value added", [2, SWITCH_MULTILEVEL, dimValue]);
    this.emitEvent("value added", [3, 32, standaloneSwitchValue]);
    this.emitEvent("value added", [5, SWITCH_MULTILEVEL, dimValue]);
    this.emitEvent("value added", [7, SWITCH_BINARY, switchValue]);
    this.emitEvent("value added", [8, SWITCH_MULTILEVEL, dimValue]);
    this.emitEvent("value added", [9, SWITCH_MULTILEVEL, dimValue]);
    this.emitEvent("node ready", [2, node2NodeInfo]);
    this.emitEvent("node ready", [5, node5NodeInfo]);
    this.emitEvent("node ready", [7, node7NodeInfo]);
    this.emitEvent("node ready", [8, node8NodeInfo]);
    this.emitEvent("node ready", [9, node9NodeInfo]);
    this.emitEvent("node event", [3, 255]);
    this.emitEvent("node event", [3, 0]);
  }

  private emitEvent(eventName, params = {}) {
    each(this.callbacks[eventName], function(callback) {
      callback.apply(null, params);
    });
  }
}

export { FakeZWave };
