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

  it "correctly parses and applies the configuration", ->
    eveningDate = new Date()
    eveningDate.setHours(16)
    eveningDate.setMinutes(0)

    period = @timeService.getPeriod(eveningDate)

    assert.equal(period, "evening")
