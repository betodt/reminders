// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Get the current URL.
 *
 * @param {function(string)} callback - called when the URL of the current tab
 *   is found.
 */
function getCurrentTabUrl(callback) {
  // Query filter to be passed to chrome.tabs.query - see
  // https://developer.chrome.com/extensions/tabs#method-query
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, function(tabs) {
    // chrome.tabs.query invokes the callback with a list of tabs that match the
    // query. When the popup is opened, there is certainly a window and at least
    // one tab, so we can safely assume that |tabs| is a non-empty array.
    // A window can only have one active tab at a time, so the array consists of
    // exactly one tab.
    var tab = tabs[0];

    // A tab is a plain object that provides information about the tab.
    // See https://developer.chrome.com/extensions/tabs#type-Tab
    var url = tab.url;

    // tab.url is only available if the "activeTab" permission is declared.
    // If you want to see the URL of other tabs (e.g. after removing active:true
    // from |queryInfo|), then the "tabs" permission is required to see their
    // "url" properties.
    console.assert(typeof url == 'string', 'tab.url should be a string');

    callback(url);
  });

  // Most methods of the Chrome extension APIs are asynchronous. This means that
  // you CANNOT do something like this:
  //
  // var url;
  // chrome.tabs.query(queryInfo, function(tabs) {
  //   url = tabs[0].url;
  // });
  // alert(url); // Shows "undefined", because chrome.tabs.query is async.
}

/**
 * create an alarm at the given time
 *
 * @param {string} name - name used for alarm
 */
function setAlarm (name) {
  chrome.alarms.create(name, {
    when: Date.now() + 1000
  });
}

/**
 * @param {string} searchTerm - Search term for Google Image search.
 * @param {function(string,number,number)} callback - Called when an image has
 *   been found. The callback gets the URL, width and height of the image.
 * @param {function(string)} errorCallback - Called when the image is not found.
 *   The callback gets a string that describes the failure reason.
 */
function getImageUrl(searchTerm, callback, errorCallback) {
  // Google image search - 100 searches per day.
  // https://developers.google.com/image-search/
  var key = 'AIzaSyDhnFdKu8hpphURPOkbTS1IuDM-uTwMLDg';
  var cx = '010614140989641971011:prpjvesmth8';
  var searchUrl = 'https://www.googleapis.com/customsearch/v1' +
    '?key=' + key +
    '&cx=' + cx +
    '&q=' + encodeURIComponent(searchTerm);
  var x = new XMLHttpRequest();
  x.open('GET', searchUrl);
  // The Google image search API responds with JSON, so let Chrome parse it.
  x.responseType = 'json';
  x.onload = function() {
    // Parse and process the response from Google Image Search.
    var response = x.response;
    if (!response || !response.items || !response.items.length === 0) {
      errorCallback('No response from Google Image search!');
      return;
    }
    var firstResult = response.items[0].pagemap.cse_thumbnail[0];
    // Take the thumbnail instead of the full image to get an approximately
    // consistent image size.
    var imageUrl = firstResult.src;
    var width = parseInt(firstResult.width);
    var height = parseInt(firstResult.height);
    console.assert(
        typeof imageUrl == 'string' && !isNaN(width) && !isNaN(height),
        'Unexpected respose from the Google Image Search API!');
    callback(imageUrl, width, height);
  };
  x.onerror = function() {
    errorCallback('Network error.');
  };
  x.send();
}

function renderStatus(statusText) {
  document.getElementById('status').textContent = statusText;
}

function bindHandlers() {
  var form = document.getElementById('reminder-form');

  form.addEventListener('submit', submitForm);

  chrome.alarms.onAlarm.addListener(alarmHandler);
  chrome.notifications.onButtonClicked.addListener(notificationButtonClickHandler);
}

function submitForm(e) {
  var reminder = document.querySelector('input[name="reminder"]');

  setAlarm(reminder.value);

  e.preventDefault();
  return false;
}

function alarmHandler(alarm) {
  chrome.notifications.create(alarm.name, {
    type: 'basic',
    iconUrl: 'icon.png',
    title: alarm.name,
    message: alarm.name,
    eventTime: alarm.scheduledTime,
    buttons: [
      {
        title: 'Dismiss',
        iconUrl: 'x.png'
      }
    ]
  }, function (notificationId) {
    console.log(notificationId);
  });
}

function notificationButtonClickHandler(notificationId, buttonIndex) {
  if (buttonIndex === 0)
    chrome.notifications.clear(notificationId);
}

document.addEventListener('DOMContentLoaded', function() {
  bindHandlers();
});
