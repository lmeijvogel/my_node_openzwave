Node = require("./node")
_ = require("lodash")
Logger = require('./logger')

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
      Logger.verbose("Scanning homeid=0x%s...", homeid.toString(16))

    zwave.on "driver failed", ->
      Logger.fatal "Failed to start driver"
      zwave.disconnect()
      process.exit()

    zwave.on "node added", (nodeid) =>
      @addNode nodeid
      Logger.verbose "Added node %d", nodeid

    zwave.on "value added", (nodeid, comclass, value) ->
      node = Node.find(nodeid)
      node.addValue comclass, value

    zwave.on "value changed", (nodeid, comclass, value) =>
      node = Node.find(nodeid)
      if node.isReady()
        if comclass == 38 || comclass == 37
          Logger.info("Node %d: %s => %s", nodeid, value["label"], value["value"])
        else
          Logger.verbose "node%d: changed: %d:%s:%s->%s", nodeid, comclass, value["label"], node.getValue(comclass, value.index)["value"], value["value"]
      else
        Logger.debug "(before nodeReady): node%d: changed: %d:%s:%s->%s", nodeid, comclass, value["label"], node.getValue(comclass, value.index)["value"], value["value"]

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
          Logger.info "node%d: message complete", nodeid
        when 1
          Logger.warn "node%d: timeout", nodeid
        when 2
          Logger.info "node%d: nop", nodeid
        when 3
          Logger.info "node%d: node awake", nodeid
        when 4
          Logger.info "node%d: node sleep", nodeid
        when 5
          Logger.warn "node%d: node dead", nodeid
        when 6
          Logger.info "node%d: node alive", nodeid

    zwave.on "event", (nodeid, event) =>
      Logger.verbose "node%d: event: %s", nodeid, event
      node = Node.find(nodeid)
      _(@eventListeners["event"]).each (handler) =>
        handler.call this, node, event

    zwave.on "scan complete", ->
      Logger.info "scan complete, hit ^C to finish."

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
    Logger.debug("Node ready, node: %s", node.toString())
    if node.isPollable()
      Logger.debug(".. enabling poll")
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
