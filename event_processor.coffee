Logger = require('./logger')
_ = require("lodash")
EventEmitter = require("events").EventEmitter

class EventProcessor extends EventEmitter
  zwave: null
  programmes: null
  nextProgrammeChooser: null

  constructor: (@zwave, @programmes, @nextProgrammeChooser) ->
    zwave.onEvent @onEvent.bind(this)

  onEvent: (node, event) ->
    switch node.nodeId
      when 3
        onOff = (if (event == 255) then "on" else "off")
        @mainSwitchPressed onOff
      else
        Logger.warn "Event from unexpected node ", node
        Logger.verbose ".. event: ", event

  programmeSelected: (programmeName) ->
    programme = @programmes[programmeName]

    if programme
      programme.apply @zwave
      @nextProgrammeChooser.setCurrentState programme

      @emit("programmeSelected", programmeName)

      Logger.info("Programme selected: %s", programmeName)
    else
      Logger.error("Programme '%s' not found.", programmeName)

  mainSwitchPressed: (onOff) ->
    Logger.info("Switch pressed: #{onOff}")

    nextProgrammeName = @nextProgrammeChooser.handle(onOff)
    nextProgramme = @programmes[nextProgrammeName]

    return  unless nextProgramme?

    try
      @programmeSelected nextProgrammeName
    catch e
      Logger.error("After switch pressed: Could not start '%s'", nextProgrammeName)
      Logger.error(e)

module.exports = EventProcessor
