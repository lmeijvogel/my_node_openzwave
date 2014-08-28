var http = require('http');
var fs = require('fs');

var MyZWave = require('./my_zwave');
var ProgrammeFactory = require('./programme_factory');
var EventProcessor = require('./event_processor');

var RedisInterface = require('./redis_interface');
var ConfigReader = require('./config_reader');
var config = ConfigReader.read("config.json");

var port = config["http"]["port"];

var testMode = process.argv[2] != 'live';

var ZWaveFactory = require('./zwave_factory');
var zwave = new ZWaveFactory(testMode).create();

http.createServer(function (req, res) {
  var result = "";
  if (testMode) {
    result = zwave.tryParse(req, res);
  }
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end(req.url+"<br/><pre>"+result+"</pre>");
}).listen(port);

console.log("Listening on 0.0.0.0:%d", port);

var redisInterface = new RedisInterface();

process.on('SIGINT', function() {
    console.log('disconnecting...');
    zwave.disconnect();
    redisInterface.cleanUp();
    process.exit();
});

var myZWave = new MyZWave(zwave);

var redisInterface = new RedisInterface();
var programmeFactory = new ProgrammeFactory(function(name) { redisInterface.programmeChanged(name); });
var programmes = programmeFactory.build(config);

var eventProcessor = new EventProcessor(myZWave, programmes);

myZWave.connect();
