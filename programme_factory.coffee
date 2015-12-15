_ = require("lodash")
Programme = require("./programme")

class ProgrammeFactory
  build: (config) ->
    lights = config.lights
    programmes = {}

    _.each(config.programmes, (programme, name) =>
      newProgramme = new Programme(name, programme.displayName, programme.values, lights)
      programmes[name] = newProgramme

      _.each(@programmeCreatedCallbacks, (callback) ->
        callback(newProgramme)
      )
    )

    programmes

  onProgrammeCreated: (callback) ->
    @programmeCreatedCallbacks ||= []

    @programmeCreatedCallbacks.push(callback)

module.exports = ProgrammeFactory
