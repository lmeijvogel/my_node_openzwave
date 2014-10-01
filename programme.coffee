_ = require("lodash")
Logger = require('./logger')

class Programme
  name: null
  lights: null
  data: null
  constructor: (@name, @data, @lights) ->

  apply: (zwave) ->
    _.forIn @data, (value, key) =>
      nodeid = @lights[key]
      try
        if value == true
          Logger.verbose("Send command 'switch on' to node %d", nodeid)
          zwave.switchOn nodeid
        else if value == false
          Logger.verbose("Send command 'switch off' to node %d", nodeid)
          zwave.switchOff nodeid
        else
          Logger.verbose("Send command 'level %d' to node %d", value, nodeid)
          zwave.setLevel nodeid, value
      catch e
        Logger.error("ERROR in programme '" + @name + "': Could not switch node '" + key + "'")

module.exports = Programme
