_ = require('lodash')
assert = require('assert')

TimeService = require('../time_service')

describe 'TimeServiceTest', ->
  beforeEach ->
    @config = { periodStarts:
      {
        "00:00": "night",
        "07:00": "morning",
        "14:00": "evening",
        "22:30": "night"
      }
    }

    @timeService = new TimeService(@config)

  # Primarily, test the behaviour at boundaries (and some more)
  input_outputs = [
    [ 0,  0, "night"],
    [ 6, 59, "night"],
    [ 7,  0, "morning"],
    [ 8, 30, "morning"],
    [15, 30, "evening"],
    [22, 29, "evening"],
    [22, 30, "night"],
    [23, 59, "night"],
  ]

  _.each(input_outputs, (data) ->
    [hour, minute, expected] = data

    context "when the time is #{hour}:#{minute}", ->
      it "should return #{expected}", ->
        date = createDate(hour, minute)

        period = @timeService.getPeriod(date)

        assert.equal(period, expected)
  )

createDate = (hours,minutes) ->
  date = new Date()
  date.setHours(hours)
  date.setMinutes(minutes)

  date