_ = require("lodash")
classy = require("classy")
Programme = require("./programme")
ProgrammeFactory = classy.define(build: (config) ->
  self = this
  lights = config.lights
  programmes = {}
  _(config.programmes).forIn (programme, name) ->
    programmes[name] = new Programme(name, programme, lights)
    return

  programmes
)
module.exports = ProgrammeFactory
