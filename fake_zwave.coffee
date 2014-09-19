
# This is for testing to see some feedbak.

# To make it possible to test interactions
#   * without actually having to connect the ZWave
#   * unit: Web requests can be used to simulate a
#   * button press.
#   

# Node will never be ready since it is a battery powered
# switch, reporting as little as possible.

# .apply() is like .call(), but with an argument array instead
# of separate arguments
create = (http_server) ->
  new FakeZWave()
_ = require("lodash")
classy = require("classy")
FakeRequestParser = require("./fake_request_parser")
FakeZWave = classy.define(
  callbacks: {}
  nodes: {}
  SWITCH_BINARY: 37
  SWITCH_MULTILEVEL: 38
  init: ->
    @fakeRequestParser = new FakeRequestParser()
    return

  on: (event_name, callback) ->
    @callbacks[event_name] = []  unless @callbacks[event_name]?
    @callbacks[event_name].push callback
    return

  connect: ->
    homeId = "128"
    @emit_event "driver ready", [homeId]
    @connected = true
    @initializeDevices()
    @emit_event "scan complete"
    @setLevel 2, 99
    @setLevel 5, 99
    @switchOn 7
    @setLevel 8, 99
    @setLevel 2, 0
    @setLevel 5, 0
    @switchOff 7
    @setLevel 8, 0
    return

  disconnect: ->
    @connected = false
    return

  tryParse: (req, res) ->
    result = @fakeRequestParser.parse(req)
    return  unless result?
    @emit_event result.type, [
      result.node
      result.value
    ]
    result

  setLevel: (nodeId, level) ->
    @nodes[nodeId]["level"] = level
    @emit_event "value changed", [
      nodeId
      38
      {
        label: "level"
        index: 0
        value: level
      }
    ]
    return

  switchOn: (nodeId) ->
    @nodes[nodeId]["value"] = true
    @emit_event "value changed", [
      nodeId
      37
      {
        label: "Switch"
        index: 0
        value: true
      }
    ]
    return

  switchOff: (nodeId) ->
    @nodes[nodeId]["value"] = false
    @emit_event "value changed", [
      nodeId
      37
      {
        label: "Switch"
        index: 0
        value: false
      }
    ]
    return

  enablePoll: (nodeid, commandClass) ->
    console.log "FAKE: EnablePoll ", nodeid, commandClass
    return

  initializeDevices: ->
    @nodes[2] = level: 0
    @nodes[3] = {}
    @nodes[5] = level: 0
    @nodes[7] = value: false
    @nodes[8] = level: 0
    node3_nodeinfo = {}
    node2_nodeinfo =
      manufacturer: "Aeon Labs"
      manufacturerid: "0086"
      product: "Smart Energy Illuminator"
      producttype: "0003"
      productid: "0008"
      type: "Multilevel Power Switch"
      name: ""
      loc: ""

    node5_nodeinfo =
      manufacturer: "FIBARO System"
      manufacturerid: "010f"
      product: ""
      producttype: "0100"
      productid: "100a"
      type: "Multilevel Power Switch"
      name: ""
      loc: ""

    node7_nodeinfo =
      manufacturer: "Z-Wave.Me"
      manufacturerid: "0115"
      product: "ZME_054313Z Flush-Mountable Switch"
      producttype: "1000"
      productid: "0001"
      type: "Binary Power Switch"
      name: ""
      loc: ""

    node8_nodeinfo =
      manufacturer: "Z-Wave.Me"
      manufacturerid: "0115"
      product: "ZME_06433 Wall Flush-Mountable Dimmer"
      producttype: "1000"
      productid: "0002"
      type: "Multilevel Power Switch"
      name: ""
      loc: ""

    @emit_event "node added", [2]
    @emit_event "node added", [3]
    @emit_event "node added", [5]
    @emit_event "node added", [7]
    @emit_event "node added", [8]
    dimValue =
      type: "byte"
      genre: "user"
      instance: 1
      index: 0
      label: "Level"
      units: ""
      read_only: false
      write_only: false
      min: 0
      max: 255
      value: 0

    switchValue =
      type: "bool"
      genre: "user"
      instance: 1
      index: 0
      label: "Switch"
      units: ""
      read_only: false
      write_only: false
      min: 0
      max: 0
      value: false

    standaloneSwitchValue =
      type: "byte"
      genre: "all"
      instance: 1
      index: 0
      label: "Basic"
      units: ""
      read_only: false
      write_only: false
      min: 0
      max: 255
      value: 0

    @emit_event "value added", [
      2
      this.SWITCH_MULTILEVEL
      dimValue
    ]
    @emit_event "value added", [
      3
      32
      standaloneSwitchValue
    ]
    @emit_event "value added", [
      5
      this.SWITCH_MULTILEVEL
      dimValue
    ]
    @emit_event "value added", [
      7
      this.SWITCH_BINARY
      switchValue
    ]
    @emit_event "value added", [
      8
      this.SWITCH_MULTILEVEL
      dimValue
    ]
    @emit_event "node ready", [
      2
      node2_nodeinfo
    ]
    @emit_event "node ready", [
      5
      node5_nodeinfo
    ]
    @emit_event "node ready", [
      7
      node7_nodeinfo
    ]
    @emit_event "node ready", [
      8
      node8_nodeinfo
    ]
    @emit_event "event", [
      3
      255
    ]
    return

  emit_event: (event_name, params) ->
    _.each @callbacks[event_name], (callback) ->
      callback.apply this, params
      return

    return
)
module.exports = FakeZWave
