/*
 * background.js
 */


/*==========*/
/* function */
/*==========*/

// send update message to contentscript.js
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  var url = tab.url;
  var query = getQuery(url);
  chrome.tabs.sendRequest(tabId, {query: query}, null);
});

function getQuery(url) {
  var par = url.split("?")[1].split("&");
  var map = new Array();
  var query, query2;
  for (var i = 0; i < par.length; i++) {
    var key = par[i].split("=")[0];
    if (key == "q") {
      query = par[i].split("=")[1].split("#")[0];
    }
    if (key == "oq") {
      query2 = par[i].split("=")[1].split("#")[0];
    }
  }

  if (query2) {
    query = query2;
  }
  return decodeURI(query);
}
