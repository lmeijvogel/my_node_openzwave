_ = require("lodash")
Programme = require("./programme")

class ProgrammeFactory
  build: (config) ->
    self = this
    lights = config.lights
    programmes = {}
    _(config.programmes).forIn (programme, name) ->
      programmes[name] = new Programme(name, programme.displayName, programme.values, lights)

    programmes

module.exports = ProgrammeFactory
