http = require("http")
fs = require("fs")
minimist = require("minimist")
_ = require("lodash")

MyZWave = require("./my_zwave")
ProgrammeFactory = require("./programme_factory")
EventProcessor = require("./event_processor")
CommandParser = require("./command_parser")
RedisInterface = require("./redis_interface")
ConfigReader = require("./config_reader")

config = new ConfigReader().read("config.json")

Logger = require('./logger')
Logger.enableLogToFile('log/openzwave.log')

argv = minimist(process.argv.slice(2))

config = new ConfigReader().read(argv['config'] ||"./config.json")
runLive = argv['live']

runHttpServer = config["http"]["enabled"]
port = config["http"]["port"]
testMode = !runLive

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
  Logger.info("Listening on 0.0.0.0, port", port)
else
  Logger.info("Not starting HTTP server. Disabled in config.")

process.on "SIGINT", ->
  Logger.info("disconnecting...")
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
  lightName = _.invert(config["lights"])[""+node.nodeId]
  redisInterface.storeValue(lightName, commandClass, value)
)

redisInterface.onCommandReceived (command) ->
  commandParser.parse(command, (programmeName) -> eventProcessor.programmeSelected(programmeName) )

eventProcessor.onProgrammeSelected (programmeName) ->
  redisInterface.programmeChanged(programmeName) if programmeName

redisInterface.start()

myZWave.connect()
