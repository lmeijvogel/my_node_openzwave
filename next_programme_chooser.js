var classy = require('classy');
var TimeStateMachine = require('./time_state_machine');

var NextProgrammeChooser = classy.define({
  programme: null,
  currentStateMachine: null,

  init: function() {
    this.stateMachines = this.buildStateMachines();

    this.currentStateMachine = _.values(this.stateMachines)[0];
  },

  setProgramme: function(programme) {
    this.programme = programme;
  },

  handle: function(event) {
    var currentState = this.currentStateMachine.state;

    this.currentStateMachine = this.chooseStateMachine();
    this.currentStateMachine.setState(currentState);

    var newState = this.currentStateMachine.handle(event);

    console.log("Entering state", newState);
    return newState;
  },

  chooseStateMachine: function() {
    if (this.isEvening()) {
      return this.stateMachines.evening;
    } else if (this.isMorning()) {
      return this.stateMachines.morning;
    } else if (this.isNight()) {
      return this.stateMachines.night;
    } else {
      console.log("WARNING: Unknown time");
      return this.stateMachines.morning;
    }
  },

  isMorning: function() {
    return (7 <= this.hour() && this.hour() < 14);
  },

  isEvening: function() {
    return (14 <= this.hour() && this.hour() < 22);
  },

  isNight: function() {
    return (this.hour() < 7 || 22 <= this.hour());
  },

  hour: function() {
    return new Date().getHours();
  },

  buildStateMachines: function() {
    var result = {};

    result.evening = new TimeStateMachine({
      on: {
        default: "evening",
        evening: "dimmed"
      }
    });

    result.morning = new TimeStateMachine({
      on: {
        default: "morning"
      }
    });

    result.night = new TimeStateMachine({
      on: {
        default: "night"
      }
    });

    return result;
  }
});

module.exports = NextProgrammeChooser;
