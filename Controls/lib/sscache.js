/**
 * sscache library
 * Copyright (c) 2011, Pamela Fox
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Creates a namespace for the sscache functions.
 */
var sscache = function() {
  // Suffixes the key name on the expiration items in sessionStorage
  // shortened to help save space
  var CACHESUFFIX = '-EXP',
	  TOUCHEDSUFFIX = '-LRU';

  // Determines if sessionStorage is supported in the browser;
  // result is cached for better performance instead of being run each time.
  // Feature detection is based on how Modernizr does it;
  // it's not straightforward due to FF4 issues.
  var supportsStorage = function () {
	try {
	  return !!sessionStorage.getItem;
	} catch (e) {
	  return false;
	}
  }();

  // Determines if native JSON (de-)serialization is supported in the browser.
  var supportsJSON = (window.JSON != null);

  /**
   * Returns the full string for the sessionStorage expiration item.
   * @param {String} key
   * @return {string}
   */
  function expirationKey(key) {
	return key + CACHESUFFIX;
  }

  /**
   * Returns the full string for the sessionStorage last access item
   * @param {String} key
   * @return {string}
   */
  function touchedKey(key) {
	return key + TOUCHEDSUFFIX;
  }

  /**
   * Returns the number of minutes since the epoch.
   * @return {number}
   */
  function currentTime() {
	return Math.floor((new Date().getTime())/60000);
  }

  function attemptStorage(key, value, time) {
	var purgeSize = 1,
		sorted = false,
		firstTry = true,
		storedKeys = [],
		storedKey,
		removeItem;

	// start the retry loop until we can store
	retryLoop();

	function retryLoop() {
	  try {
		// store into the touchedKey first. This way, if we overflow, we always
		// have the smallest units for reduction
		sessionStorage.setItem(touchedKey(key), currentTime());

		if (time > 0) {
		  // if time is set, then add an expires key
		  sessionStorage.setItem(expirationKey(key), currentTime() + time);
		  sessionStorage.setItem(key, value);
		}
		else if (time < 0 || time === 0) {
		  // if time is in the past or explictly 0, it's auto-expired
		  // remove the key and return
		  sessionStorage.removeItem(touchedKey(key));
		  sessionStorage.removeItem(expirationKey(key));
		  sessionStorage.removeItem(key);
		  return;
		}
		else {
		  // no time is set, it was a "forever" setting
		  sessionStorage.setItem(key, value);
		}
	  }
	  catch(e) {
		if (e.name === 'QUOTA_EXCEEDED_ERR' || e.name == 'NS_ERROR_DOM_QUOTA_REACHED') {
		  // if we fail and there's nothing in sessionStorage, then
		  // there is simply too much trying to be stored (> 5mb) and we fail it quietly
		  if (storedKeys.length === 0 && !firstTry) {
			sessionStorage.removeItem(touchedKey(key));
			sessionStorage.removeItem(expirationKey(key));
			sessionStorage.removeItem(key);
			return false;
		  }

		  // firstTry logic ensures we don't test for size conditions
		  // until the second+ time through
		  if (firstTry) {
			firstTry = false;
		  }

		  // If we exceeded the quota, then we will sort
		  // by the expire time, and then remove the N oldest
		  if (!sorted) {
			for (var i = 0, len = sessionStorage.length; i < len; i++) {
			  storedKey = sessionStorage.key(i);
			  if (storedKey.indexOf(TOUCHEDSUFFIX) > -1) {
				var mainKey = storedKey.split(TOUCHEDSUFFIX)[0];
				storedKeys.push({key: mainKey, touched: parseInt(sessionStorage.getItem(storedKey), 10)});
			  }
			}
			storedKeys.sort(function(a, b) { return (a.touched-b.touched); });
		  }

		  // LRU
		  removeItem = storedKeys.shift();
		  if (removeItem) {
			sessionStorage.removeItem(touchedKey(removeItem.key));
			sessionStorage.removeItem(expirationKey(removeItem.key));
			sessionStorage.removeItem(removeItem.key);
		  }

		  // try again (currently recursive)
		  retryLoop();
		}
		else {
		  // this was some other error. Give up
		  return;
		}
	  }
	}
  }

  return {

	/**
	 * Stores the value in sessionStorage. Expires after specified number of minutes.
	 * @param {string} key
	 * @param {Object|string} value
	 * @param {number} time
	 */
	set: function(key, value, time) {
	  if (!supportsStorage)
	{
		return;
	}

	  // If we don't get a string value, try to stringify
	  // In future, sessionStorage may properly support storing non-strings
	  // and this can be removed.
	  if (typeof value != 'string') {
		if (!supportsJSON)
		{
			return;
		}
		try {
		  value = JSON.stringify(value);
		} catch (e) {
		  // Sometimes we can't stringify due to circular refs
		  // in complex objects, so we won't bother storing then.
		  return;
		}
	  }

	  attemptStorage(key, value, time);
	},

	/**
	 * Retrieves specified value from sessionStorage, if not expired.
	 * @param {string} key
	 * @return {string|Object}
	 */
	get: function(key) {
	  if (!supportsStorage)
	{
		return null;
	}

	  /**
	   * Tries to de-serialize stored value if its an object, and returns the
	   * normal value otherwise.
	   * @param {String} key
	   */
	  function parsedStorage(key) {
		 if (supportsJSON) {
		   try {
			 // We can't tell if its JSON or a string, so we try to parse
			 var value = JSON.parse(sessionStorage.getItem(key));
			 return value;
		   } catch(e) {
			 // If we can't parse, it's probably because it isn't an object
			 return sessionStorage.getItem(key);
		   }
		 } else {
		   return sessionStorage.getItem(key);
		 }
	  }

	  // Return the de-serialized item if not expired
	  if (sessionStorage.getItem(expirationKey(key))) {
		var expirationTime = parseInt(sessionStorage.getItem(expirationKey(key)), 10);
		// Check if we should actually kick item out of storage
		if (currentTime() >= expirationTime) {
		  sessionStorage.removeItem(key);
		  sessionStorage.removeItem(expirationKey(key));
		  sessionStorage.removeItem(touchedKey(key));
		  return null;
		} else {
		  sessionStorage.setItem(touchedKey(key), currentTime());
		  return parsedStorage(key);
		}
	  } else if (sessionStorage.getItem(key)) {
		sessionStorage.setItem(touchedKey(key), currentTime());
		return parsedStorage(key);
	  }
	  return null;
	},

	/**
	 * Removes a value from sessionStorage.
	 * Equivalent to 'delete' in memcache, but that's a keyword in JS.
	 * @param {string} key
	 */
	remove: function(key) {
	  if (!supportsStorage)
	{
		return null;
	}
	  sessionStorage.removeItem(key);
	  sessionStorage.removeItem(expirationKey(key));
	  sessionStorage.removeItem(touchedKey(key));
	}
  };
}();