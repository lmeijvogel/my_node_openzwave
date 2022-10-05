"use strict";

/*
 * This is for testing to see some feedback.

 * To make it possible to test interactions
 * without actually having to connect the ZWave
 * unit: Web requests can be used to simulate a
 * button press.

 * Node will never be ready since it is a battery powered
 * switch, reporting as little as possible.
 */

var _                 = require("lodash");

var FakeRequestParser = require("./fake_request_parser");
var Logger            = require('./logger');

function FakeZWave() {
  var callbacks = {};
  var nodes = {};
  var SWITCH_BINARY = 37;
  var SWITCH_MULTILEVEL = 38;

  var fakeRequestParser = FakeRequestParser();

  function on(event_name, callback) {
    if (!callbacks[event_name]) {
      callbacks[event_name] = [];
    }

    callbacks[event_name].push(callback);
  }

  function connect() {
    var homeId = "128";
    emit_event("driver ready", [homeId]);

    initializeDevices();

    emit_event("scan complete");
    setLevel(2, 99);

    setLevel(5, 99);
    switchOn(7);
    setLevel(8, 99);
    setLevel(2, 0);
    setLevel(5, 0);
    switchOff(7);
    setLevel(8, 0);
  }

  function disconnect() {
  }

  function tryParse(req) {
    var result = fakeRequestParser.parse(req);

    if (result) {
      emit_event(result.type, [
        result.node,
        result.value
      ]);
    }
  }

  function logValue(nodeId, commandClass) {
    var value = { label: "TestLabel", value: 12};
    Logger.info("Node value requested: node %d: %d:%s: %s",
      parseInt(nodeId, 10),
      commandClass,
      value["label"],
      value["value"]
    );
  }

  function setLevel(nodeId, level) {
    nodes[nodeId]["level"] = level;
    emit_event("value changed", [
      nodeId,
      38,
      {
        label: "level",
        index: 0,
        value: level
      }
    ]);
  }

  function switchOn(nodeId) {
    nodes[nodeId]["value"] = true;
    emit_event("value changed", [
      nodeId,
      37,
      {
        label: "Switch",
        index: 0,
        value: true
      }
    ]);
  }

  function switchOff(nodeId) {
    nodes[nodeId]["value"] = false;
    emit_event("value changed", [
      nodeId,
      37,
      {
        label: "Switch",
        index: 0,
        value: false
      }
    ]);
  }

  function enablePoll(nodeid, commandClass) {
    Logger.debug("FAKE: EnablePoll", nodeid, commandClass);
  }

  function initializeDevices() {
    nodes[2] = {level: 0};
    nodes[3] = {};
    nodes[5] = {level: 0};
    nodes[7] = {value: false};
    nodes[8] = {level: 0};
    nodes[9] = {level: 0};

    var node2_nodeinfo = {
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
    // var node3_nodeinfo = {};

    var node5_nodeinfo = {
      manufacturer: "FIBARO System",
      manufacturerid: "010f",
      product: "",
      producttype: "0100",
      productid: "100a",
      type: "Multilevel Power Switch",
      name: "",
      loc: ""
    };
    var node7_nodeinfo = {
      manufacturer: "Z-Wave.Me",
      manufacturerid: "0115",
      product: "ZME_054313Z Flush-Mountable Switch",
      producttype: "1000",
      productid: "0001",
      type: "Binary Power Switch",
      name: "",
      loc: ""
    };

    var node8_nodeinfo = {
      manufacturer: "Z-Wave.Me",
      manufacturerid: "0115",
      product: "ZME_06433 Wall Flush-Mountable Dimmer",
      producttype: "1000",
      productid: "0002",
      type: "Multilevel Power Switch",
      name: "",
      loc: ""
    };

    var node9_nodeinfo = {
      manufacturer: "Aeon Labs",
      manufacturerid: "0086",
      product: "Smart Energy Illuminator",
      producttype: "0003",
      productid: "0008",
      type: "Multilevel Power Switch",
      name: "",
      loc: ""
    };

    emit_event("node added", [2]);
    emit_event("node added", [3]);
    emit_event("node added", [5]);
    emit_event("node added", [7]);
    emit_event("node added", [8]);
    emit_event("node added", [9]);
    var dimValue = {
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

    var switchValue = {
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

    var standaloneSwitchValue = {
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

    emit_event("value added", [
      2,
      SWITCH_MULTILEVEL,
      dimValue
    ]);
    emit_event("value added", [
      3,
      32,
      standaloneSwitchValue
    ]);
    emit_event("value added", [
      5,
      SWITCH_MULTILEVEL,
      dimValue
    ]);
    emit_event("value added", [
      7,
      SWITCH_BINARY,
      switchValue
    ]);
    emit_event("value added", [
      8,
      SWITCH_MULTILEVEL,
      dimValue
    ]);
    emit_event("value added", [
      9,
      SWITCH_MULTILEVEL,
      dimValue
    ]);
    emit_event("node ready", [
      2,
      node2_nodeinfo
    ]);
    emit_event("node ready", [
      5,
      node5_nodeinfo
    ]);
    emit_event("node ready", [
      7,
      node7_nodeinfo
    ]);
    emit_event("node ready", [
      8,
      node8_nodeinfo
    ]);
    emit_event("node ready", [
      9,
      node9_nodeinfo
    ]);
    emit_event("node event", [
      3,
      255
    ]);
    emit_event("node event", [
      3,
      0
    ]);
  }

  function emit_event(event_name, params) {
    _.each(callbacks[event_name], function (callback) {
      callback.apply(this, params);
    });
  }

  return {
    on: on,
    connect: connect,
    disconnect: disconnect,
    tryParse: tryParse,
    enablePoll: enablePoll,
    setLevel: setLevel,
    switchOff: switchOff,
    switchOn: switchOn,
    logValue: logValue
  };
}

module.exports = FakeZWave;
