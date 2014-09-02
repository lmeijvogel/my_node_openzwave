var classy = require('classy');
var Redis  = require('redis');
var _      = require('lodash');

var RedisInterface = classy.define({
  subscriptionRedis: null,
  dataRedis: null,

  commandReceivedHandlers: null,

  commandChannel: null,

  init: function(commandChannel) {
    this.commandChannel   = commandChannel;

    this.commandReceivedHandlers = [];
  },

  start: function() {
    var self = this;
    this.subscriptionRedis = Redis.createClient();
    this.dataRedis = Redis.createClient();
    this.subscriptionRedis.on("message", function(channel, message) {
      console.log("Message received: "+ channel +": '"+ message +"'");
      if (channel == self.commandChannel) {
        _.each(self.commandReceivedHandlers, function(handler) {
          handler.call(this, message);
        });
      }
    });

    this.subscriptionRedis.subscribe(this.commandChannel);
  },

  programmeChanged: function(name) {
    this.dataRedis.set("zwave_programme", name);
  },

  onCommandReceived: function(handler) {
    this.commandReceivedHandlers.push(handler);
  },

  cleanUp: function() {
    this.subscriptionRedis.unsubscribe();
    this.subscriptionRedis.end();
    this.dataRedis.end();
  }
});

module.exports = RedisInterface;
