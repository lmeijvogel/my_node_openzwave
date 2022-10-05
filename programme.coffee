classy = require("classy")
_ = require("lodash")
Programme = classy.define(
  name: null
  lights: null
  data: null
  init: (name, data, lights) ->
    @name = name
    @lights = lights
    @data = data
    return

  apply: (zwave) ->
    self = this
    _.forIn @data, (value, key) ->
      nodeid = self.lights[key]
      try
        if value is true
          zwave.switchOn nodeid
        else if value is false
          zwave.switchOff nodeid
        else
          zwave.setLevel nodeid, value
      catch e
        console.log "ERROR in programme '" + self.name + "': Could not switch node '" + key + "'"
      return

    return
)
module.exports = Programme
