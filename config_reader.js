var fs = require('fs');

read = function(filename) {
  var contents = fs.readFileSync(filename, 'utf8');

  return JSON.parse(contents);
};

exports.read = read;
