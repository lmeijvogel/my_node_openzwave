_ = require('lodash')

class TimeService
  constructor: (config) ->
    throw "No periodStarts defined in config" unless config.periodStarts
    @lookupTable = config.periodStarts

  getPeriod: (now) ->
    candidateKeys = _.chain(_.keys(@lookupTable)).select( (k) =>
      periodStart = @stringToTimeToday(k)

      periodStart < now
    ).value()

    key = _.last(candidateKeys)

    @lookupTable[key]

  stringToTimeToday: (timeString) ->
    splittedString = timeString.split(":")
    [hours, minutes] = _.map(splittedString, (str) ->
      parseInt(str, 10)
    )

    result = new Date()
    result.setHours(hours)
    result.setMinutes(minutes)
    result.setSeconds(0)

    result

module.exports = TimeService
