var classy = require('classy');
var Redis  = require('redis');

var RedisInterface = classy.define({
  redis: null,

  init: function() {
    this.redis = Redis.createClient();
  },

  programmeChanged: function(name) {
    this.redis.set("zwave_programme", name);
  },

  cleanUp: function() {
    this.redis.end();
  }
});

module.exports = RedisInterface;
