_ = require("lodash")

class Programme
  name: null
  lights: null
  data: null
  constructor: (@name, @data, @lights) ->

  apply: (zwave) ->
    _.forIn @data, (value, key) =>
      nodeid = @lights[key]
      try
        if value is true
          zwave.switchOn nodeid
        else if value is false
          zwave.switchOff nodeid
        else
          zwave.setLevel nodeid, value
      catch e
        console.log "ERROR in programme '" + @name + "': Could not switch node '" + key + "'"

module.exports = Programme
