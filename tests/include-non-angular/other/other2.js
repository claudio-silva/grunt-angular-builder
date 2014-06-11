//------------------------------------------------------------------------------------
// other2.js
//------------------------------------------------------------------------------------

//# require ("other3.js")

var page = require ('webpage').create (),
  system = require ('system'),
  fs = require ('fs'),
  address, output;

if (system.args.length != 3) {
  console.log ('Usage: ' + system.args[0] + ' source-filename output-filename');
  phantom.exit (1);
}
address = system.args[1];
output = system.args[2];

page.paperSize = {
  format:      'A4',
  orientation: 'portrait',
  margin:      {
    top:    "0.32in",
    right:  "0.39in",
    bottom: "0.00in",
    left:   "0.39in"
  }
};
