var classy = require("classy");

 var TimeService = classy.define({
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
 });

module.exports = TimeService
