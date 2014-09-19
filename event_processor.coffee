classy = require("classy")
NextProgrammeChooser = require("./next_programme_chooser")
_ = require("lodash")
EventProcessor = classy.define(
  zwave: null
  programmes: null
  nextProgrammeChooser: null
  init: (zwave, programmes) ->
    @zwave = zwave
    @programmes = programmes
    @nextProgrammeChooser = new NextProgrammeChooser()
    zwave.onEvent @onEvent.bind(this)
    return

  onEvent: (node, event) ->
    switch node.nodeId
      when 3
        onOff = (if (event is 255) then "on" else "off")
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
    return

  mainSwitchPressed: (event) ->
    nextProgrammeName = @nextProgrammeChooser.handle(event)
    nextProgramme = @programmes[nextProgrammeName]
    return  unless nextProgramme?
    try
      @programmeSelected nextProgrammeName
    catch e
      console.log "ERROR: Could not start '" + nextProgrammeName + "'"
      console.log e
    return
)
module.exports = EventProcessor
