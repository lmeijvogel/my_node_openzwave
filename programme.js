var classy = require('classy');
var _ = require('lodash');

var Programme = classy.define({
  name: null,
  lights: null,
  data: null,

  init: function( name, data, lights ) {
    this.name   = name;
    this.lights = lights;
    this.data   = data;
  },

  apply: function( zwave ) {
    var self = this;

    _.forIn(this.data, function(value, key) {
      var nodeid = self.lights[key];

      try {
        if (value === true) {
          zwave.switchOn(nodeid);
        } else if (value === false) {
          zwave.switchOff(nodeid);
        } else {
          zwave.setLevel(nodeid, value);
        }
      }
      catch(e) {
        console.log("ERROR in programme '"+ self.name +"': Could not switch node '"+ key +"'");
      }
    });
  }
});

module.exports = Programme;
