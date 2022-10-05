util = require("util")
_ = require("lodash")
nodes = {}
class Node
  POLLABLE_CLASSES: [
    0x25
    0x26
  ]
  values: null
  info: null
  ready: null
  constructor: (@nodeId) ->
    @values = {}
    @info = {}

  addValue: (commandClass, value) ->
    @values[commandClass] = []  unless @values[commandClass]
    @setValue commandClass, value

  setValue: (commandClass, value) ->
    @values[commandClass][value.index] = value

  getValue: (commandClass, index) ->
    @values[commandClass][index]

  removeValue: (commandClass, index) ->
    delete @values[commandClass][index]  if @values[commandClass] && @values[commandClass][index]

  setReady: ->
    @ready = true

  isReady: ->
    @ready

  setNodeInfo: (nodeInfo) ->
    @info["manufacturer"] = nodeInfo.manufacturer
    @info["manufacturerid"] = nodeInfo.manufacturerid
    @info["product"] = nodeInfo.product
    @info["producttype"] = nodeInfo.producttype
    @info["productid"] = nodeInfo.productid
    @info["type"] = nodeInfo.type
    @info["name"] = nodeInfo.name
    @info["loc"] = nodeInfo.loc

  toString: ->
    result = ""
    for commandClassIdx of @values
      commandClass = @values[commandClassIdx]
      result += util.format("node%d: class %d\n", @nodeId, commandClassIdx)
      for idx of commandClass
        command = commandClass[idx]
        result += util.format("node%d:   %s=%s", @nodeId, command["label"], command["value"])
    result

  isPollable: ->
    _.any @pollableClasses()

  pollableClasses: ->
    keys = _.keys(@values)
    _.select keys, (commandClassIdx) =>
      commandClass = @values[commandClassIdx]
      intCommandClassIdx = parseInt(commandClassIdx, 10)

      # 0x25: COMMAND_CLASS_SWITCH_BINARY
      # 0x26: COMMAND_CLASS_SWITCH_MULTILEVEL
      _.contains @POLLABLE_CLASSES, intCommandClassIdx

Node.find = (nodeid) ->
  nodes[parseInt(nodeid, 10)]

Node.all = ->
  nodes #_.compact(nodes);

Node.add = (nodeid) ->
  nodes[nodeid] = new Node(nodeid)

module.exports = Node
