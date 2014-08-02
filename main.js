/*
 * OpenZWave test program.
 */

var http = require('http');
var fs = require('fs');
var MyZWave = require('./my_zwave');

var port = 4567;

var testMode = process.argv[2] != 'live';

var zwaveFactory = require('./zwave_factory');
var zwave = zwaveFactory.create(testMode);

http.createServer(function (req, res) {
    if (testMode) {
      zwave.tryParse(req, res);
    }
    console.log("received request.");
    res.writeHead(200, {'Content-Type': 'text/xml'});
    res.end(index);
}).listen(port);

console.log("Listening on 0.0.0.0:%d", port);

process.on('SIGINT', function() {
    console.log('disconnecting...');
    zwave.disconnect();
    process.exit();
});

(new MyZWave.MyZWave(zwave).connect());
