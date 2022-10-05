Node = require("./node")
_ = require("lodash")
class MyZWave
  zwave: null
  nodes: null
  eventListeners: null

  constructor: (@zwave) ->
    @nodes = []
    @eventListeners = {}

  registerEvents: ->
    zwave = @zwave
    zwave.on "driver ready", (homeid) ->
      console.log "scanning homeid=0x%s...", homeid.toString(16)

    zwave.on "driver failed", ->
      console.log "failed to start driver"
      zwave.disconnect()
      process.exit()

    zwave.on "node added", (nodeid) =>
      @addNode nodeid
      console.log "Added node %d", nodeid

    zwave.on "value added", (nodeid, comclass, value) ->
      node = Node.find(nodeid)
      node.addValue comclass, value

    zwave.on "value changed", (nodeid, comclass, value) =>
      node = Node.find(nodeid)
      console.log "node%d: changed: %d:%s:%s->%s", nodeid, comclass, value["label"], node.getValue(comclass, value.index)["value"], value["value"]  if node.isReady()
      node.setValue comclass, value

      _.each(@eventListeners['valueChange'], (handler) =>
        handler.call(this, node, comclass, value)
      )

    zwave.on "value removed", (nodeid, comclass, index) ->
      node = Node.find(nodeid)
      node.removeValue comclass, index

    zwave.on "node ready", (nodeid, nodeinfo) =>
      @nodeReady nodeid, nodeinfo

    zwave.on "notification", (nodeid, notif) ->
      switch notif
        when 0
          console.log "node%d: message complete", nodeid
        when 1
          console.log "node%d: timeout", nodeid
        when 2
          console.log "node%d: nop", nodeid
        when 3
          console.log "node%d: node awake", nodeid
        when 4
          console.log "node%d: node sleep", nodeid
        when 5
          console.log "node%d: node dead", nodeid
        when 6
          console.log "node%d: node alive", nodeid

    zwave.on "event", (nodeid, event) =>
      console.log "node%d: event", nodeid
      console.log ".. ", event
      node = Node.find(nodeid)
      _(@eventListeners["event"]).each (handler) =>
        handler.call this, node, event

    zwave.on "scan complete", ->
      console.log "scan complete, hit ^C to finish."

  connect: ->
    @registerEvents()
    @zwave.connect()

  onEvent: (handler) ->
    @eventListeners["event"] = []  unless @eventListeners["event"]
    @eventListeners["event"].push handler

  onValueChange: (handler) ->
    if (!this.eventListeners['valueChange'])
      this.eventListeners['valueChange'] = []

    this.eventListeners['valueChange'].push(handler)

  addNode: (nodeid) ->
    Node.add nodeid
    @nodes[nodeid] =
      manufacturer: ""
      manufacturerid: ""
      product: ""
      producttype: ""
      productid: ""
      type: ""
      name: ""
      loc: ""
      classes: {}
      ready: false

  nodeReady: (nodeid, nodeinfo) ->
    node = Node.find(nodeid)
    node.setNodeInfo nodeinfo
    node.setReady()
    console.log node.toString()
    if node.isPollable()
      console.log ".. enabling poll"
      this.enablePoll node

  enablePoll: (node) ->
    _(node.pollableClasses()).each (commandClass) =>
      @zwave.enablePoll node.nodeId, commandClass

  setLevel: (nodeid, level) ->
    @zwave.setLevel nodeid, level

  switchOn: (nodeid) ->
    @zwave.switchOn nodeid

  switchOff: (nodeid) ->
    @zwave.switchOff nodeid

module.exports = MyZWave
