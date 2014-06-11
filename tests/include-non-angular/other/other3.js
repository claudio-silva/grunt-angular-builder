//------------------------------------------------------------------------------------
// other3.js
//------------------------------------------------------------------------------------

try {
  page.open ('file://' + address, function ()
  {

    page.evaluate (function ()
    {
      document.documentElement.className += 'PhantomJS';
    });
    page.render (output);
    phantom.exit ();
  });

}
catch (e) {
  console.log (e);
  phantom.exit (2);
}
