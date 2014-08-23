_ = require('lodash');
var classy = require('classy');
var FakeRequestParser = require('./fake_request_parser');

FakeZWave = classy.define({
  callbacks: {},
  nodes: {},
  SWITCH_BINARY: 37,
  SWITCH_MULTILEVEL: 38,

  init: function() {
    this.fakeRequestParser = new FakeRequestParser();
  },

  on: function(event_name, callback) {
    if (this.callbacks[event_name] == undefined) {
      this.callbacks[event_name] = [];
    }

    this.callbacks[event_name].push(callback);
  },

  connect: function() {
    var homeId = "128";
    this.emit_event('driver ready', [homeId]);

    this.connected = true;

    this.initializeDevices();

    this.emit_event('scan complete');
  },

  disconnect: function() {
    this.connected = false;
  },

  /* To make it possible to test interactions
   * without actually having to connect the ZWave
   * unit: Web requests can be used to simulate a
   * button press.
   */
  tryParse: function(req, res) {
    var result = this.fakeRequestParser.parse(req);

    if (result == null) {
      return;
    }

    this.emit_event(result.type, [result.node, result.value]);

    return result;
  },

  setLevel: function(nodeId, level) {
    this.nodes[nodeId]["level"] = level;

    this.emit_event("value changed", [nodeId, 38, {label: "level", index: 0, value: level}]);
  },

  switchOn: function(nodeId) {
    this.nodes[nodeId]["value"] = true;

    this.emit_event("value changed", [nodeId, 37, {label: "Switch", index: 0, value: true}]);
  },

  switchOff: function(nodeId) {
    this.nodes[nodeId]["value"] = false;

    this.emit_event("value changed", [nodeId, 37, {label: "Switch", index: 0, value: false}]);
  },
  initializeDevices: function() {
    this.nodes[2] = {level: 0};
    this.nodes[3] = {};
    this.nodes[5] = {level: 0};
    this.nodes[7] = {value: false};
    this.nodes[8] = {level: 0};

    // Node will never be ready since it is a battery powered
    // switch, reporting as little as possible.
    var node3_nodeinfo = {};

    var node2_nodeinfo = {
      manufacturer: 'Aeon Labs',
      manufacturerid: '0086',
      product: 'Smart Energy Illuminator',
      producttype: '0003',
      productid: '0008',
      type: 'Multilevel Power Switch',
      name: '',
      loc: ''
    };

    var node5_nodeinfo = {
      manufacturer: 'FIBARO System',
      manufacturerid: '010f',
      product: '',
      producttype: '0100',
      productid: '100a',
      type: 'Multilevel Power Switch',
      name: '',
      loc: ''
    };

    var node7_nodeinfo = {
      manufacturer: 'Z-Wave.Me',
      manufacturerid: '0115',
      product: 'ZME_054313Z Flush-Mountable Switch',
      producttype: '1000',
      productid: '0001',
      type: 'Binary Power Switch',
      name: '',
      loc: ''
    };

    var node8_nodeinfo = {
      manufacturer: 'Z-Wave.Me',
      manufacturerid: '0115',
      product: 'ZME_06433 Wall Flush-Mountable Dimmer',
      producttype: '1000',
      productid: '0002',
      type: 'Multilevel Power Switch',
      name: '',
      loc: ''
    };

    this.emit_event('node added', [2]);
    this.emit_event('node added', [3]);
    this.emit_event('node added', [5]);
    this.emit_event('node added', [7]);
    this.emit_event('node added', [8]);

    var dimValue = { type: 'byte',
      genre: 'user',
      instance: 1,
      index: 0,
      label: 'Level',
      units: '',
      read_only: false,
      write_only: false,
      min: 0,
      max: 255,
      value: 0 };

    var switchValue = { type: 'bool',
      genre: 'user',
      instance: 1,
      index: 0,
      label: 'Switch',
      units: '',
      read_only: false,
      write_only: false,
      min: 0,
      max: 0,
      value: false };

    var standaloneSwitchValue = { type: 'byte',
      genre: 'all',
      instance: 1,
      index: 0,
      label: 'Basic',
      units: '',
      read_only: false,
      write_only: false,
      min: 0,
      max: 255,
      value: 0 };

    this.emit_event('value added', [2, this.SWITCH_MULTILEVEL, dimValue]);
    this.emit_event('value added', [3, 32, standaloneSwitchValue]);
    this.emit_event('value added', [5, this.SWITCH_MULTILEVEL, dimValue]);
    this.emit_event('value added', [7, this.SWITCH_BINARY, switchValue]);
    this.emit_event('value added', [8, this.SWITCH_MULTILEVEL, dimValue]);

    this.emit_event('node ready', [2, node2_nodeinfo]);
    this.emit_event('node ready', [5, node5_nodeinfo]);
    this.emit_event('node ready', [7, node7_nodeinfo]);
    this.emit_event('node ready', [8, node8_nodeinfo]);

    this.emit_event('event', [3, 255]);
  },

  emit_event: function(event_name, params) {
    _.each(this.callbacks[event_name], function(callback) {
      // .apply() is like .call(), but with an argument array instead
      // of separate arguments
      callback.apply(this, params);
    });
  },
});

function create(http_server) {
  return new FakeZWave();
}

module.exports = FakeZWave;
