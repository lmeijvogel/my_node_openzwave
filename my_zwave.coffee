classy = require("classy")
Node = require("./node")
_ = require("lodash")
MyZWave = classy.define(
  zwave: null
  nodes: null
  eventListeners: null
  init: (zwave) ->
    @zwave = zwave
    @nodes = []
    @eventListeners = {}
    return

  registerEvents: ->
    self = this
    zwave = @zwave
    zwave.on "driver ready", (homeid) ->
      console.log "scanning homeid=0x%s...", homeid.toString(16)
      return

    zwave.on "driver failed", ->
      console.log "failed to start driver"
      zwave.disconnect()
      process.exit()
      return

    zwave.on "node added", (nodeid) ->
      self.addNode nodeid
      console.log "Added node %d", nodeid
      return

    zwave.on "value added", (nodeid, comclass, value) ->
      node = Node.find(nodeid)
      node.addValue comclass, value
      return

    zwave.on "value changed", (nodeid, comclass, value) =>
      node = Node.find(nodeid)
      console.log "node%d: changed: %d:%s:%s->%s", nodeid, comclass, value["label"], node.getValue(comclass, value.index)["value"], value["value"]  if node.isReady()
      node.setValue comclass, value
      return

      _.each(@eventListeners['valueChange'], (handler) =>
        handler.call(this, node, comclass, value)
      )

    zwave.on "value removed", (nodeid, comclass, index) ->
      node = Node.find(nodeid)
      node.removeValue comclass, index
      return

    zwave.on "node ready", (nodeid, nodeinfo) ->
      self.nodeReady nodeid, nodeinfo
      return

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

    zwave.on "event", (nodeid, event) ->
      console.log "node%d: event", nodeid
      console.log ".. ", event
      node = Node.find(nodeid)
      _(@eventListeners["event"]).each (handler) =>
        handler.call this, node, event

        return

      return

    zwave.on "scan complete", ->
      console.log "scan complete, hit ^C to finish."
      return

    return

  connect: ->
    @registerEvents()
    @zwave.connect()
    return

  onEvent: (handler) ->
    @eventListeners["event"] = []  unless @eventListeners["event"]
    @eventListeners["event"].push handler
    return

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

    return

  nodeReady: (nodeid, nodeinfo) ->
    self = this
    node = Node.find(nodeid)
    node.setNodeInfo nodeinfo
    node.setReady()
    console.log node.toString()
    if node.isPollable()
      console.log ".. enabling poll"
      self.enablePoll node
    return

  enablePoll: (node) ->
    self = this
    _(node.pollableClasses()).each (commandClass) ->
      self.zwave.enablePoll node.nodeId, commandClass
      return

    return

  setLevel: (nodeid, level) ->
    @zwave.setLevel nodeid, level
    return

  switchOn: (nodeid) ->
    @zwave.switchOn nodeid
    return

  switchOff: (nodeid) ->
    @zwave.switchOff nodeid
    return
)
module.exports = MyZWave
