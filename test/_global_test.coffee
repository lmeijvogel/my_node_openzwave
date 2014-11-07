Logger = require('../logger')

before ->
  Logger.setSilent(true)

after ->
  Logger.setSilent(false)
