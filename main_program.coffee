http = require("http")
fs = require("fs")
_  = require("lodash")

MyZWave = require("./my_zwave")
ProgrammeFactory = require("./programme_factory")
EventProcessor = require("./event_processor")
CommandParser = require("./command_parser")
RedisInterface = require("./redis_interface")
ConfigReader = require("./config_reader")

config = new ConfigReader().read("config.json")

runHttpServer = config["http"]["enabled"]
port = config["http"]["port"]
testMode = process.argv[2] isnt "live"

ZWaveFactory = require("./zwave_factory")
zwave = new ZWaveFactory(testMode).create()

if runHttpServer
  http.createServer((req, res) ->
    result = ""
    result = zwave.tryParse(req, res) if testMode
    res.writeHead 200,
      "Content-Type": "text/plain"

    res.end req.url + "<br/><pre>" + result + "</pre>"
  ).listen port
  console.log "Listening on 0.0.0.0:%d", port
else
  console.log "Not starting HTTP server. Disabled in config."

process.on "SIGINT", ->
  console.log "disconnecting..."
  zwave.disconnect()
  redisInterface.cleanUp()
  process.exit()

myZWave = new MyZWave(zwave)
redisInterface = new RedisInterface("MyZWave")
commandParser = new CommandParser()

programmeFactory = new ProgrammeFactory()
programmes = programmeFactory.build(config)

eventProcessor = new EventProcessor(myZWave, programmes)

myZWave.onValueChange((node, commandClass, value) ->
  console.log(config)
  lightName = _.invert(config["lights"])[""+node.nodeId]
  redisInterface.storeValue(lightName, commandClass, value)
)

redisInterface.onCommandReceived (command) ->
  commandParser.parse command

commandParser.onProgrammeSelected (programmeName) ->
  eventProcessor.programmeSelected programmeName

redisInterface.start()

myZWave.connect()
