classy = require("classy")
TimeService = classy.define(
  isMorning: ->
    7 <= @hour() and @hour() < 14

  isEvening: ->
    14 <= @hour() and @hour() < 22

  isNight: ->
    @hour() < 7 or 22 <= @hour()

  hour: ->
    new Date().getHours()
)
module.exports = TimeService
