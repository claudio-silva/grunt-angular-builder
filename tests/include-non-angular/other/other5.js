//------------------------------------------------------------------------------------
// other5.js
//------------------------------------------------------------------------------------

// Let's create a cyclic reference and see what happens...
//# require ("other4.js")

page.onConsoleMessage = function (msg)
{
  console.log (msg);
};

page.onResourceRequested = function (requestData, networkRequest)
{
  console.log ('\nRequest (#' + requestData.id + '): ' + JSON.stringify (requestData));
};

page.onResourceReceived = function (response)
{
  console.log ('\nResponse (#' + response.id + ', stage "' + response.stage + '"): ' + JSON.stringify (response));
};