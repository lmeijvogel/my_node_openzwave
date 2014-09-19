NextProgrammeChooser = require("./next_programme_chooser")
_ = require("lodash")

class EventProcessor
  zwave: null
  programmes: null
  nextProgrammeChooser: null

  constructor: (@zwave, @programmes) ->
    @nextProgrammeChooser = new NextProgrammeChooser()
    zwave.onEvent @onEvent.bind(this)

  onEvent: (node, event) ->
    switch node.nodeId
      when 3
        onOff = (if (event == 255) then "on" else "off")
        @mainSwitchPressed onOff
      else
        console.log "Event from unexpected node ", node
        console.log ".. event: ", event

  programmeSelected: (programmeName) ->
    programme = @programmes[programmeName]
    if programme
      programme.apply @zwave
      @nextProgrammeChooser.setProgramme programme
      console.log "Programme selected:", programmeName
    else
      console.log "ERROR: Programme '" + programmeName + "' not found."

  mainSwitchPressed: (event) ->
    nextProgrammeName = @nextProgrammeChooser.handle(event)
    nextProgramme = @programmes[nextProgrammeName]
    return  unless nextProgramme?
    try
      @programmeSelected nextProgrammeName
    catch e
      console.log "ERROR: Could not start '" + nextProgrammeName + "'"
      console.log e

module.exports = EventProcessor
