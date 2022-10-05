var classy = require('classy');
var _ = require('lodash');

var TimeStateMachine = classy.define({
  transitions: null,
  state: null,

  init: function(transitions) {
    this.transitions = _.defaults(transitions, {off: { default: "off" } });
  },

  handle: function(event) {
    var currentTransitions = this.transitions[event];

    if (!currentTransitions) {
      return;
    }

    var newState = currentTransitions[this.state];

    if (!newState) {
      newState = currentTransitions.default;
    }

    this.setState(newState);
    return newState;
  },

  setState: function(newState) {
    this.state = newState;
  },
});

module.exports = TimeStateMachine;
