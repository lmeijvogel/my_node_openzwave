var classy = require('classy');
var _ = require('lodash');

var Programme = classy.define({
  lights: null,
  data: null,

  init: function( data, lights ) {
    this.lights = lights;
    this.data   = data;
  },

  apply: function( zwave ) {
    var self = this;

    _.forIn(this.data, function(value, key) {
      var nodeid = self.lights[key];

      if (value === true) {
        zwave.switchOn(nodeid);
      } else if (value === false) {
        zwave.switchOff(nodeid);
      } else {
        zwave.setLevel(nodeid, value);
      }
    });
  }
});

module.exports = Programme;
