/*
 * contentscript.js
 */


/*===================*/
/* Constant Variable */
/*===================*/
var KEY_CODE = {
  TAB: 9,
  ENTER: 13,
  UP_ARROW: 38,
  DOWN_ARROW: 40
};

var INTERVAL_TAB_THRESHOLD = 150;
var EXTENSION_ID = chrome.i18n.getMessage("@@extension_id");


/*==========*/
/* varialbe */
/*==========*/
var isFirstPage,
    isInitialized,
    currentPtr,
    maxPtrPosition,
    numOfResults,
    lastTabKeyDownTime,
    currentQuery,
    searchBoxId;

/*============*/
/* initialize */
/*============*/
(function () {
  console.log("contentscript.js loaded");

  isInitialized = false;

  // inject script in user-end context.
  var elem = document.createElement("script");
  elem.type = "text/javascript";
  elem.src = "chrome-extension://" + EXTENSION_ID + "/injectedscript.js";
  document.head.appendChild(elem);

  lastTabKeyDownTime = (new Date()).getTime();
})();

function initAfterDomLoad() {

  currentPtr = 0;

  // Whether this page is 1st result page.
  var pnElement = document.getElementsByClassName("pn");
  if (pnElement.length == 1) {
    isFirstPage = true;
  } else {
    isFirstPage = false;
  }
  console.log("isFirstPage = " + isFirstPage);

  // 検索結果の数(正確にはカーソルが移動する数)を算出
  numOfResults = getNumOfResults();
  if (isFirstPage) {
    maxPtrPosition = numOfResults + 1; // 1 is toNext.
  } else {
    maxPtrPosition = numOfResults + 2; // 2 is toPrev and toNext.
  }

  // 検索ボックスのIDを取得
  searchBoxId = getSearchBoxId();
  // console.log("seachBoxId = " + searchBoxId);

  isInitialized = true;
}


/*================*/
/* event listener */
/*================*/
// receive update message from background.js
chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
  console.log("current tab updated with query: " + request.query);

  currentQuery = request.query;
  isInitialized = false;
});

window.onkeydown = function(event) {
  if (event.keyCode == KEY_CODE.TAB) {
    if (!isInitialized) {
      initAfterDomLoad();
    }
    onTabKeyDown(event, event.shiftKey);
  }
}

/*==========*/
/* function */
/*==========*/
// 検索結果の数(正確にはカーソルが移動する数)を算出する
function getNumOfResults() {
  var results = 0;
  results += document.getElementsByClassName("l").length; //普通の検索結果
  results += document.getElementsByClassName("noline").length; //Youtubeとか
  results += document.getElementsByClassName("r inl").length; //画像検索結果とか
  results -= document.getElementsByClassName("l noline").length; //かぶってるものを削除
  
  console.log("numOfResults = " + results);

  return results;
}

// 検索ボックスのIDを取得する
function getSearchBoxId() {
  var inputElem = document.getElementsByTagName("input");
  var searchBox;
  for (var i = 0; i < inputElem.length; i++) {
    // if (inputElem[i].value.replace(" ", "+") == currentQuery) {
      // searchBox = inputElem[i];
      // break;
    // }
    if (inputElem[i].name == "q") {
      searchBox = inputElem[i];
      break;
    }
  }
  return searchBox.id;
}

// TAB押下時
function onTabKeyDown(event, isShiftKeyDown) {

  var newTime = (new Date()).getTime();
  var interval = newTime - lastTabKeyDownTime;
  // console.log("interval = " + interval);
  lastTabKeyDownTime = newTime;
  
  if (interval <= INTERVAL_TAB_THRESHOLD) {
    console.log("go to search box!");
    setTimeout(function() {
      var searchBox = document.getElementById(searchBoxId);
      searchBox.focus();
      searchBox.setSelectionRange(0, searchBox.value.length);
    }, 1);
    currentPtr = -1;
    return;
  }
  
  event.stopPropagation();
  event.preventDefault();

  if (!isShiftKeyDown) {
    if (currentPtr == 0) {
      // do nothing
    } else if (!isFirstPage && (currentPtr == maxPtrPosition-1)) { // Current Pointer is toPrev.
      movePtrNTimes(numOfResults+2, true);
    } else {
      movePtrNTimes(1, true);
    }

    // 次へボタンにいる場合
    if (currentPtr == maxPtrPosition) {
      currentPtr = 0;
    } else {
      currentPtr++;
    }

  } else {
    if (currentPtr == 0) {
      // do nothing
    } else if (!isFirstPage && (currentPtr == maxPtrPosition)) { // Current Pointer is toNext.
      console.log("back?");
      movePtrNTimes(1, false);
      movePtrNTimes(numOfResults, true);
      currentPtr--;
    } else if ((currentPtr == numOfResults+1)) {
      movePtrNTimes(1, false);
      movePtrNTimes(numOfResults-1, true);
      currentPtr--;
    } else {
      movePtrNTimes(1, false);
      currentPtr--;
    }
  }
  console.log("currentPtr = " + currentPtr);
}

// カーソルをn回下に(上に)移動する
function movePtrNTimes(n, isDown) {
  var req = {
    numOfTimes: n,
    isDown: isDown
  };

  var message = "movePtrNTimes("
              + JSON.stringify(req)
              + ");";

  constructScriptTag(message);
}

// スクリプトをPagesのコンテキストに埋め込む
function constructScriptTag(message) {
  var elem = document.createElement("script");
  elem.type = "text/javascript";
  elem.innerHTML = message;
  document.head.appendChild(elem);
}

