var classy = require('classy');
var _ = require('lodash');

var Programme = classy.define({
  name: null,
  lights: null,
  data: null,
  enterListeners: null,

  init: function( name, data, lights ) {
    this.name   = name;
    this.lights = lights;
    this.data   = data;
    this.enterListeners = [];
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

    this.notifyEnter();
  },

  notifyEnter: function() {
    var self = this;

    _(this.enterListeners).each(function(listener) {
      listener.call(this, self.name);
    });
  },

  onEnter: function(listener) {
    this.enterListeners.push(listener);
  }
});

module.exports = Programme;
