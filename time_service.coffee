class TimeService
  isMorning: ->  7 <= @hour() && @hour() < 14
  isEvening: -> 14 <= @hour() && @hour() < 22
  isNight:   -> 22 <= @hour() || @hour() < 7

  hour:      -> new Date().getHours()

module.exports = TimeService
