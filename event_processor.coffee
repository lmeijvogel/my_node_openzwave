NextProgrammeChooser = require("./next_programme_chooser")
Logger = require('./logger')

_ = require("lodash")

class EventProcessor
  zwave: null
  programmes: null
  nextProgrammeChooser: null

  constructor: (@zwave, @programmes) ->
    @nextProgrammeChooser = new NextProgrammeChooser()
    zwave.onEvent @onEvent.bind(this)
    @programmeSelectedCallbacks = []

  onEvent: (node, event) ->
    switch node.nodeId
      when 3
        onOff = (if (event == 255) then "on" else "off")
        @mainSwitchPressed onOff
      else
        Logger.warn "Event from unexpected node ", node
        Logger.verbose ".. event: ", event

  onProgrammeSelected: (callback) ->
    @programmeSelectedCallbacks.push callback

  programmeSelected: (programmeName) ->
    programme = @programmes[programmeName]

    if programme
      programme.apply @zwave
      @nextProgrammeChooser.setProgramme programme

      _(@programmeSelectedCallbacks).each((callback) ->
        callback(programmeName)
      )

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
      Logger.error("Could not start '%s'", nextProgrammeName)
      Logger.error(e)

module.exports = EventProcessor
