//Fri Feb 23 2018 00:27:11 GMT+0000 (UTC)
var _neo = _neo || {};
_neo.styles = _neo.styles || {};
_neo.styles.thirdparty = _neo.styles.thirdparty || {};/**
* Nike Experimental Operations (NEO)
*
*      ::::    ::: :::::::::: ::::::::
*     :+:+:   :+:           :+:    :+:
*    :+:+:+  +:+           +:+    +:+
*   +#+ +:+ +#+ +#++:++#  +#+    +:+
*  +#+  +#+#+#           +#+    +#+
* #+#   #+#+#           #+#    #+#
*###    #### ########## ########
*
* 01001110 01000101 01001111
*
* @version 4.779.0
* @description A/B/n/TMS Library
* @author neo
*/
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/*!
 * @overview es6-promise - a tiny implementation of Promises/A+.
 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/stefanpenner/es6-promise/master/LICENSE
 * @version   4.1.1
 */

(function (global, factory) {
  (typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object' && typeof module !== 'undefined' ? module.exports = factory() : typeof define === 'function' && define.amd ? define(factory) : global.ES6Promise = factory();
})(this, function () {
  'use strict';

  function objectOrFunction(x) {
    var type = typeof x === 'undefined' ? 'undefined' : _typeof(x);
    return x !== null && (type === 'object' || type === 'function');
  }

  function isFunction(x) {
    return typeof x === 'function';
  }

  var _isArray = undefined;
  if (Array.isArray) {
    _isArray = Array.isArray;
  } else {
    _isArray = function _isArray(x) {
      return Object.prototype.toString.call(x) === '[object Array]';
    };
  }

  var isArray = _isArray;

  var len = 0;
  var vertxNext = undefined;
  var customSchedulerFn = undefined;

  var asap = function asap(callback, arg) {
    queue[len] = callback;
    queue[len + 1] = arg;
    len += 2;
    if (len === 2) {
      // If len is 2, that means that we need to schedule an async flush.
      // If additional callbacks are queued before the queue is flushed, they
      // will be processed by this flush that we are scheduling.
      if (customSchedulerFn) {
        customSchedulerFn(flush);
      } else {
        scheduleFlush();
      }
    }
  };

  function setScheduler(scheduleFn) {
    customSchedulerFn = scheduleFn;
  }

  function setAsap(asapFn) {
    asap = asapFn;
  }

  var browserWindow = typeof window !== 'undefined' ? window : undefined;
  var browserGlobal = browserWindow || {};
  var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
  var isNode = typeof self === 'undefined' && typeof process !== 'undefined' && {}.toString.call(process) === '[object process]';

  // test for web worker but not in IE10
  var isWorker = typeof Uint8ClampedArray !== 'undefined' && typeof importScripts !== 'undefined' && typeof MessageChannel !== 'undefined';

  // node
  function useNextTick() {
    // node version 0.10.x displays a deprecation warning when nextTick is used recursively
    // see https://github.com/cujojs/when/issues/410 for details
    return function () {
      return process.nextTick(flush);
    };
  }

  // vertx
  function useVertxTimer() {
    if (typeof vertxNext !== 'undefined') {
      return function () {
        vertxNext(flush);
      };
    }

    return useSetTimeout();
  }

  function useMutationObserver() {
    var iterations = 0;
    var observer = new BrowserMutationObserver(flush);
    var node = document.createTextNode('');
    observer.observe(node, { characterData: true });

    return function () {
      node.data = iterations = ++iterations % 2;
    };
  }

  // web worker
  function useMessageChannel() {
    var channel = new MessageChannel();
    channel.port1.onmessage = flush;
    return function () {
      return channel.port2.postMessage(0);
    };
  }

  function useSetTimeout() {
    // Store setTimeout reference so es6-promise will be unaffected by
    // other code modifying setTimeout (like sinon.useFakeTimers())
    var globalSetTimeout = setTimeout;
    return function () {
      return globalSetTimeout(flush, 1);
    };
  }

  var queue = new Array(1000);
  function flush() {
    for (var i = 0; i < len; i += 2) {
      var callback = queue[i];
      var arg = queue[i + 1];

      callback(arg);

      queue[i] = undefined;
      queue[i + 1] = undefined;
    }

    len = 0;
  }

  function attemptVertx() {
    try {
      var r = require;
      var vertx = r('vertx');
      vertxNext = vertx.runOnLoop || vertx.runOnContext;
      return useVertxTimer();
    } catch (e) {
      return useSetTimeout();
    }
  }

  var scheduleFlush = undefined;
  // Decide what async method to use to triggering processing of queued callbacks:
  if (isNode) {
    scheduleFlush = useNextTick();
  } else if (BrowserMutationObserver) {
    scheduleFlush = useMutationObserver();
  } else if (isWorker) {
    scheduleFlush = useMessageChannel();
  } else if (browserWindow === undefined && typeof require === 'function') {
    scheduleFlush = attemptVertx();
  } else {
    scheduleFlush = useSetTimeout();
  }

  function then(onFulfillment, onRejection) {
    var _arguments = arguments;

    var parent = this;

    var child = new this.constructor(noop);

    if (child[PROMISE_ID] === undefined) {
      makePromise(child);
    }

    var _state = parent._state;

    if (_state) {
      (function () {
        var callback = _arguments[_state - 1];
        asap(function () {
          return invokeCallback(_state, child, callback, parent._result);
        });
      })();
    } else {
      subscribe(parent, child, onFulfillment, onRejection);
    }

    return child;
  }

  /**
    `Promise.resolve` returns a promise that will become resolved with the
    passed `value`. It is shorthand for the following:
  
    ```javascript
    let promise = new Promise(function(resolve, reject){
      resolve(1);
    });
  
    promise.then(function(value){
      // value === 1
    });
    ```
  
    Instead of writing the above, your code now simply becomes the following:
  
    ```javascript
    let promise = Promise.resolve(1);
  
    promise.then(function(value){
      // value === 1
    });
    ```
  
    @method resolve
    @static
    @param {Any} value value that the returned promise will be resolved with
    Useful for tooling.
    @return {Promise} a promise that will become fulfilled with the given
    `value`
  */
  function resolve$1(object) {
    /*jshint validthis:true */
    var Constructor = this;

    if (object && (typeof object === 'undefined' ? 'undefined' : _typeof(object)) === 'object' && object.constructor === Constructor) {
      return object;
    }

    var promise = new Constructor(noop);
    resolve(promise, object);
    return promise;
  }

  var PROMISE_ID = Math.random().toString(36).substring(16);

  function noop() {}

  var PENDING = void 0;
  var FULFILLED = 1;
  var REJECTED = 2;

  var GET_THEN_ERROR = new ErrorObject();

  function selfFulfillment() {
    return new TypeError("You cannot resolve a promise with itself");
  }

  function cannotReturnOwn() {
    return new TypeError('A promises callback cannot return that same promise.');
  }

  function getThen(promise) {
    try {
      return promise.then;
    } catch (error) {
      GET_THEN_ERROR.error = error;
      return GET_THEN_ERROR;
    }
  }

  function tryThen(then$$1, value, fulfillmentHandler, rejectionHandler) {
    try {
      then$$1.call(value, fulfillmentHandler, rejectionHandler);
    } catch (e) {
      return e;
    }
  }

  function handleForeignThenable(promise, thenable, then$$1) {
    asap(function (promise) {
      var sealed = false;
      var error = tryThen(then$$1, thenable, function (value) {
        if (sealed) {
          return;
        }
        sealed = true;
        if (thenable !== value) {
          resolve(promise, value);
        } else {
          fulfill(promise, value);
        }
      }, function (reason) {
        if (sealed) {
          return;
        }
        sealed = true;

        reject(promise, reason);
      }, 'Settle: ' + (promise._label || ' unknown promise'));

      if (!sealed && error) {
        sealed = true;
        reject(promise, error);
      }
    }, promise);
  }

  function handleOwnThenable(promise, thenable) {
    if (thenable._state === FULFILLED) {
      fulfill(promise, thenable._result);
    } else if (thenable._state === REJECTED) {
      reject(promise, thenable._result);
    } else {
      subscribe(thenable, undefined, function (value) {
        return resolve(promise, value);
      }, function (reason) {
        return reject(promise, reason);
      });
    }
  }

  function handleMaybeThenable(promise, maybeThenable, then$$1) {
    if (maybeThenable.constructor === promise.constructor && then$$1 === then && maybeThenable.constructor.resolve === resolve$1) {
      handleOwnThenable(promise, maybeThenable);
    } else {
      if (then$$1 === GET_THEN_ERROR) {
        reject(promise, GET_THEN_ERROR.error);
        GET_THEN_ERROR.error = null;
      } else if (then$$1 === undefined) {
        fulfill(promise, maybeThenable);
      } else if (isFunction(then$$1)) {
        handleForeignThenable(promise, maybeThenable, then$$1);
      } else {
        fulfill(promise, maybeThenable);
      }
    }
  }

  function resolve(promise, value) {
    if (promise === value) {
      reject(promise, selfFulfillment());
    } else if (objectOrFunction(value)) {
      handleMaybeThenable(promise, value, getThen(value));
    } else {
      fulfill(promise, value);
    }
  }

  function publishRejection(promise) {
    if (promise._onerror) {
      promise._onerror(promise._result);
    }

    publish(promise);
  }

  function fulfill(promise, value) {
    if (promise._state !== PENDING) {
      return;
    }

    promise._result = value;
    promise._state = FULFILLED;

    if (promise._subscribers.length !== 0) {
      asap(publish, promise);
    }
  }

  function reject(promise, reason) {
    if (promise._state !== PENDING) {
      return;
    }
    promise._state = REJECTED;
    promise._result = reason;

    asap(publishRejection, promise);
  }

  function subscribe(parent, child, onFulfillment, onRejection) {
    var _subscribers = parent._subscribers;
    var length = _subscribers.length;

    parent._onerror = null;

    _subscribers[length] = child;
    _subscribers[length + FULFILLED] = onFulfillment;
    _subscribers[length + REJECTED] = onRejection;

    if (length === 0 && parent._state) {
      asap(publish, parent);
    }
  }

  function publish(promise) {
    var subscribers = promise._subscribers;
    var settled = promise._state;

    if (subscribers.length === 0) {
      return;
    }

    var child = undefined,
        callback = undefined,
        detail = promise._result;

    for (var i = 0; i < subscribers.length; i += 3) {
      child = subscribers[i];
      callback = subscribers[i + settled];

      if (child) {
        invokeCallback(settled, child, callback, detail);
      } else {
        callback(detail);
      }
    }

    promise._subscribers.length = 0;
  }

  function ErrorObject() {
    this.error = null;
  }

  var TRY_CATCH_ERROR = new ErrorObject();

  function tryCatch(callback, detail) {
    try {
      return callback(detail);
    } catch (e) {
      TRY_CATCH_ERROR.error = e;
      return TRY_CATCH_ERROR;
    }
  }

  function invokeCallback(settled, promise, callback, detail) {
    var hasCallback = isFunction(callback),
        value = undefined,
        error = undefined,
        succeeded = undefined,
        failed = undefined;

    if (hasCallback) {
      value = tryCatch(callback, detail);

      if (value === TRY_CATCH_ERROR) {
        failed = true;
        error = value.error;
        value.error = null;
      } else {
        succeeded = true;
      }

      if (promise === value) {
        reject(promise, cannotReturnOwn());
        return;
      }
    } else {
      value = detail;
      succeeded = true;
    }

    if (promise._state !== PENDING) {
      // noop
    } else if (hasCallback && succeeded) {
      resolve(promise, value);
    } else if (failed) {
      reject(promise, error);
    } else if (settled === FULFILLED) {
      fulfill(promise, value);
    } else if (settled === REJECTED) {
      reject(promise, value);
    }
  }

  function initializePromise(promise, resolver) {
    try {
      resolver(function resolvePromise(value) {
        resolve(promise, value);
      }, function rejectPromise(reason) {
        reject(promise, reason);
      });
    } catch (e) {
      reject(promise, e);
    }
  }

  var id = 0;
  function nextId() {
    return id++;
  }

  function makePromise(promise) {
    promise[PROMISE_ID] = id++;
    promise._state = undefined;
    promise._result = undefined;
    promise._subscribers = [];
  }

  function Enumerator$1(Constructor, input) {
    this._instanceConstructor = Constructor;
    this.promise = new Constructor(noop);

    if (!this.promise[PROMISE_ID]) {
      makePromise(this.promise);
    }

    if (isArray(input)) {
      this.length = input.length;
      this._remaining = input.length;

      this._result = new Array(this.length);

      if (this.length === 0) {
        fulfill(this.promise, this._result);
      } else {
        this.length = this.length || 0;
        this._enumerate(input);
        if (this._remaining === 0) {
          fulfill(this.promise, this._result);
        }
      }
    } else {
      reject(this.promise, validationError());
    }
  }

  function validationError() {
    return new Error('Array Methods must be provided an Array');
  }

  Enumerator$1.prototype._enumerate = function (input) {
    for (var i = 0; this._state === PENDING && i < input.length; i++) {
      this._eachEntry(input[i], i);
    }
  };

  Enumerator$1.prototype._eachEntry = function (entry, i) {
    var c = this._instanceConstructor;
    var resolve$$1 = c.resolve;

    if (resolve$$1 === resolve$1) {
      var _then = getThen(entry);

      if (_then === then && entry._state !== PENDING) {
        this._settledAt(entry._state, i, entry._result);
      } else if (typeof _then !== 'function') {
        this._remaining--;
        this._result[i] = entry;
      } else if (c === Promise$3) {
        var promise = new c(noop);
        handleMaybeThenable(promise, entry, _then);
        this._willSettleAt(promise, i);
      } else {
        this._willSettleAt(new c(function (resolve$$1) {
          return resolve$$1(entry);
        }), i);
      }
    } else {
      this._willSettleAt(resolve$$1(entry), i);
    }
  };

  Enumerator$1.prototype._settledAt = function (state, i, value) {
    var promise = this.promise;

    if (promise._state === PENDING) {
      this._remaining--;

      if (state === REJECTED) {
        reject(promise, value);
      } else {
        this._result[i] = value;
      }
    }

    if (this._remaining === 0) {
      fulfill(promise, this._result);
    }
  };

  Enumerator$1.prototype._willSettleAt = function (promise, i) {
    var enumerator = this;

    subscribe(promise, undefined, function (value) {
      return enumerator._settledAt(FULFILLED, i, value);
    }, function (reason) {
      return enumerator._settledAt(REJECTED, i, reason);
    });
  };

  /**
    `Promise.all` accepts an array of promises, and returns a new promise which
    is fulfilled with an array of fulfillment values for the passed promises, or
    rejected with the reason of the first passed promise to be rejected. It casts all
    elements of the passed iterable to promises as it runs this algorithm.
  
    Example:
  
    ```javascript
    let promise1 = resolve(1);
    let promise2 = resolve(2);
    let promise3 = resolve(3);
    let promises = [ promise1, promise2, promise3 ];
  
    Promise.all(promises).then(function(array){
      // The array here would be [ 1, 2, 3 ];
    });
    ```
  
    If any of the `promises` given to `all` are rejected, the first promise
    that is rejected will be given as an argument to the returned promises's
    rejection handler. For example:
  
    Example:
  
    ```javascript
    let promise1 = resolve(1);
    let promise2 = reject(new Error("2"));
    let promise3 = reject(new Error("3"));
    let promises = [ promise1, promise2, promise3 ];
  
    Promise.all(promises).then(function(array){
      // Code here never runs because there are rejected promises!
    }, function(error) {
      // error.message === "2"
    });
    ```
  
    @method all
    @static
    @param {Array} entries array of promises
    @param {String} label optional string for labeling the promise.
    Useful for tooling.
    @return {Promise} promise that is fulfilled when all `promises` have been
    fulfilled, or rejected if any of them become rejected.
    @static
  */
  function all$1(entries) {
    return new Enumerator$1(this, entries).promise;
  }

  /**
    `Promise.race` returns a new promise which is settled in the same way as the
    first passed promise to settle.
  
    Example:
  
    ```javascript
    let promise1 = new Promise(function(resolve, reject){
      setTimeout(function(){
        resolve('promise 1');
      }, 200);
    });
  
    let promise2 = new Promise(function(resolve, reject){
      setTimeout(function(){
        resolve('promise 2');
      }, 100);
    });
  
    Promise.race([promise1, promise2]).then(function(result){
      // result === 'promise 2' because it was resolved before promise1
      // was resolved.
    });
    ```
  
    `Promise.race` is deterministic in that only the state of the first
    settled promise matters. For example, even if other promises given to the
    `promises` array argument are resolved, but the first settled promise has
    become rejected before the other promises became fulfilled, the returned
    promise will become rejected:
  
    ```javascript
    let promise1 = new Promise(function(resolve, reject){
      setTimeout(function(){
        resolve('promise 1');
      }, 200);
    });
  
    let promise2 = new Promise(function(resolve, reject){
      setTimeout(function(){
        reject(new Error('promise 2'));
      }, 100);
    });
  
    Promise.race([promise1, promise2]).then(function(result){
      // Code here never runs
    }, function(reason){
      // reason.message === 'promise 2' because promise 2 became rejected before
      // promise 1 became fulfilled
    });
    ```
  
    An example real-world use case is implementing timeouts:
  
    ```javascript
    Promise.race([ajax('foo.json'), timeout(5000)])
    ```
  
    @method race
    @static
    @param {Array} promises array of promises to observe
    Useful for tooling.
    @return {Promise} a promise which settles in the same way as the first passed
    promise to settle.
  */
  function race$1(entries) {
    /*jshint validthis:true */
    var Constructor = this;

    if (!isArray(entries)) {
      return new Constructor(function (_, reject) {
        return reject(new TypeError('You must pass an array to race.'));
      });
    } else {
      return new Constructor(function (resolve, reject) {
        var length = entries.length;
        for (var i = 0; i < length; i++) {
          Constructor.resolve(entries[i]).then(resolve, reject);
        }
      });
    }
  }

  /**
    `Promise.reject` returns a promise rejected with the passed `reason`.
    It is shorthand for the following:
  
    ```javascript
    let promise = new Promise(function(resolve, reject){
      reject(new Error('WHOOPS'));
    });
  
    promise.then(function(value){
      // Code here doesn't run because the promise is rejected!
    }, function(reason){
      // reason.message === 'WHOOPS'
    });
    ```
  
    Instead of writing the above, your code now simply becomes the following:
  
    ```javascript
    let promise = Promise.reject(new Error('WHOOPS'));
  
    promise.then(function(value){
      // Code here doesn't run because the promise is rejected!
    }, function(reason){
      // reason.message === 'WHOOPS'
    });
    ```
  
    @method reject
    @static
    @param {Any} reason value that the returned promise will be rejected with.
    Useful for tooling.
    @return {Promise} a promise rejected with the given `reason`.
  */
  function reject$1(reason) {
    /*jshint validthis:true */
    var Constructor = this;
    var promise = new Constructor(noop);
    reject(promise, reason);
    return promise;
  }

  function needsResolver() {
    throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
  }

  function needsNew() {
    throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
  }

  /**
    Promise objects represent the eventual result of an asynchronous operation. The
    primary way of interacting with a promise is through its `then` method, which
    registers callbacks to receive either a promise's eventual value or the reason
    why the promise cannot be fulfilled.
  
    Terminology
    -----------
  
    - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
    - `thenable` is an object or function that defines a `then` method.
    - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
    - `exception` is a value that is thrown using the throw statement.
    - `reason` is a value that indicates why a promise was rejected.
    - `settled` the final resting state of a promise, fulfilled or rejected.
  
    A promise can be in one of three states: pending, fulfilled, or rejected.
  
    Promises that are fulfilled have a fulfillment value and are in the fulfilled
    state.  Promises that are rejected have a rejection reason and are in the
    rejected state.  A fulfillment value is never a thenable.
  
    Promises can also be said to *resolve* a value.  If this value is also a
    promise, then the original promise's settled state will match the value's
    settled state.  So a promise that *resolves* a promise that rejects will
    itself reject, and a promise that *resolves* a promise that fulfills will
    itself fulfill.
  
  
    Basic Usage:
    ------------
  
    ```js
    let promise = new Promise(function(resolve, reject) {
      // on success
      resolve(value);
  
      // on failure
      reject(reason);
    });
  
    promise.then(function(value) {
      // on fulfillment
    }, function(reason) {
      // on rejection
    });
    ```
  
    Advanced Usage:
    ---------------
  
    Promises shine when abstracting away asynchronous interactions such as
    `XMLHttpRequest`s.
  
    ```js
    function getJSON(url) {
      return new Promise(function(resolve, reject){
        let xhr = new XMLHttpRequest();
  
        xhr.open('GET', url);
        xhr.onreadystatechange = handler;
        xhr.responseType = 'json';
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.send();
  
        function handler() {
          if (this.readyState === this.DONE) {
            if (this.status === 200) {
              resolve(this.response);
            } else {
              reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
            }
          }
        };
      });
    }
  
    getJSON('/posts.json').then(function(json) {
      // on fulfillment
    }, function(reason) {
      // on rejection
    });
    ```
  
    Unlike callbacks, promises are great composable primitives.
  
    ```js
    Promise.all([
      getJSON('/posts'),
      getJSON('/comments')
    ]).then(function(values){
      values[0] // => postsJSON
      values[1] // => commentsJSON
  
      return values;
    });
    ```
  
    @class Promise
    @param {function} resolver
    Useful for tooling.
    @constructor
  */
  function Promise$3(resolver) {
    this[PROMISE_ID] = nextId();
    this._result = this._state = undefined;
    this._subscribers = [];

    if (noop !== resolver) {
      typeof resolver !== 'function' && needsResolver();
      this instanceof Promise$3 ? initializePromise(this, resolver) : needsNew();
    }
  }

  Promise$3.all = all$1;
  Promise$3.race = race$1;
  Promise$3.resolve = resolve$1;
  Promise$3.reject = reject$1;
  Promise$3._setScheduler = setScheduler;
  Promise$3._setAsap = setAsap;
  Promise$3._asap = asap;

  Promise$3.prototype = {
    constructor: Promise$3,

    /**
      The primary way of interacting with a promise is through its `then` method,
      which registers callbacks to receive either a promise's eventual value or the
      reason why the promise cannot be fulfilled.
       ```js
      findUser().then(function(user){
        // user is available
      }, function(reason){
        // user is unavailable, and you are given the reason why
      });
      ```
       Chaining
      --------
       The return value of `then` is itself a promise.  This second, 'downstream'
      promise is resolved with the return value of the first promise's fulfillment
      or rejection handler, or rejected if the handler throws an exception.
       ```js
      findUser().then(function (user) {
        return user.name;
      }, function (reason) {
        return 'default name';
      }).then(function (userName) {
        // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
        // will be `'default name'`
      });
       findUser().then(function (user) {
        throw new Error('Found user, but still unhappy');
      }, function (reason) {
        throw new Error('`findUser` rejected and we're unhappy');
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
        // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
      });
      ```
      If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.
       ```js
      findUser().then(function (user) {
        throw new PedagogicalException('Upstream error');
      }).then(function (value) {
        // never reached
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // The `PedgagocialException` is propagated all the way down to here
      });
      ```
       Assimilation
      ------------
       Sometimes the value you want to propagate to a downstream promise can only be
      retrieved asynchronously. This can be achieved by returning a promise in the
      fulfillment or rejection handler. The downstream promise will then be pending
      until the returned promise is settled. This is called *assimilation*.
       ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // The user's comments are now available
      });
      ```
       If the assimliated promise rejects, then the downstream promise will also reject.
       ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // If `findCommentsByAuthor` fulfills, we'll have the value here
      }, function (reason) {
        // If `findCommentsByAuthor` rejects, we'll have the reason here
      });
      ```
       Simple Example
      --------------
       Synchronous Example
       ```javascript
      let result;
       try {
        result = findResult();
        // success
      } catch(reason) {
        // failure
      }
      ```
       Errback Example
       ```js
      findResult(function(result, err){
        if (err) {
          // failure
        } else {
          // success
        }
      });
      ```
       Promise Example;
       ```javascript
      findResult().then(function(result){
        // success
      }, function(reason){
        // failure
      });
      ```
       Advanced Example
      --------------
       Synchronous Example
       ```javascript
      let author, books;
       try {
        author = findAuthor();
        books  = findBooksByAuthor(author);
        // success
      } catch(reason) {
        // failure
      }
      ```
       Errback Example
       ```js
       function foundBooks(books) {
       }
       function failure(reason) {
       }
       findAuthor(function(author, err){
        if (err) {
          failure(err);
          // failure
        } else {
          try {
            findBoooksByAuthor(author, function(books, err) {
              if (err) {
                failure(err);
              } else {
                try {
                  foundBooks(books);
                } catch(reason) {
                  failure(reason);
                }
              }
            });
          } catch(error) {
            failure(err);
          }
          // success
        }
      });
      ```
       Promise Example;
       ```javascript
      findAuthor().
        then(findBooksByAuthor).
        then(function(books){
          // found books
      }).catch(function(reason){
        // something went wrong
      });
      ```
       @method then
      @param {Function} onFulfilled
      @param {Function} onRejected
      Useful for tooling.
      @return {Promise}
    */
    then: then,

    /**
      `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
      as the catch block of a try/catch statement.
       ```js
      function findAuthor(){
        throw new Error('couldn't find that author');
      }
       // synchronous
      try {
        findAuthor();
      } catch(reason) {
        // something went wrong
      }
       // async with promises
      findAuthor().catch(function(reason){
        // something went wrong
      });
      ```
       @method catch
      @param {Function} onRejection
      Useful for tooling.
      @return {Promise}
    */
    'catch': function _catch(onRejection) {
      return this.then(null, onRejection);
    }
  };

  /*global self*/
  function polyfill$1() {
    var local = undefined;

    if (typeof global !== 'undefined') {
      local = global;
    } else if (typeof self !== 'undefined') {
      local = self;
    } else {
      try {
        local = Function('return this')();
      } catch (e) {
        throw new Error('polyfill failed because global object is unavailable in this environment');
      }
    }

    var P = local.Promise;

    if (P) {
      var promiseToString = null;
      try {
        promiseToString = Object.prototype.toString.call(P.resolve());
      } catch (e) {
        // silently ignored
      }

      if (promiseToString === '[object Promise]' && !P.cast) {
        return;
      }
    }

    local.Promise = Promise$3;
  }

  // Strange compat..
  Promise$3.polyfill = polyfill$1;
  Promise$3.Promise = Promise$3;

  Promise$3.polyfill();

  return Promise$3;
});

//# sourceMappingURL=es6-promise.auto.map
// Production steps of ECMA-262, Edition 6, 22.1.2.1
if (!Array.from) {
  Array.from = function () {
    var toStr = Object.prototype.toString;
    var isCallable = function isCallable(fn) {
      return typeof fn === 'function' || toStr.call(fn) === '[object Function]';
    };
    var toInteger = function toInteger(value) {
      var number = Number(value);
      if (isNaN(number)) {
        return 0;
      }
      if (number === 0 || !isFinite(number)) {
        return number;
      }
      return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
    };
    var maxSafeInteger = Math.pow(2, 53) - 1;
    var toLength = function toLength(value) {
      var len = toInteger(value);
      return Math.min(Math.max(len, 0), maxSafeInteger);
    };

    // The length property of the from method is 1.
    return function from(arrayLike /*, mapFn, thisArg */) {
      // 1. Let C be the this value.
      var C = this;

      // 2. Let items be ToObject(arrayLike).
      var items = Object(arrayLike);

      // 3. ReturnIfAbrupt(items).
      if (arrayLike == null) {
        throw new TypeError('Array.from requires an array-like object - not null or undefined');
      }

      // 4. If mapfn is undefined, then let mapping be false.
      var mapFn = arguments.length > 1 ? arguments[1] : void undefined;
      var T;
      if (typeof mapFn !== 'undefined') {
        // 5. else
        // 5. a If IsCallable(mapfn) is false, throw a TypeError exception.
        if (!isCallable(mapFn)) {
          throw new TypeError('Array.from: when provided, the second argument must be a function');
        }

        // 5. b. If thisArg was supplied, let T be thisArg; else let T be undefined.
        if (arguments.length > 2) {
          T = arguments[2];
        }
      }

      // 10. Let lenValue be Get(items, "length").
      // 11. Let len be ToLength(lenValue).
      var len = toLength(items.length);

      // 13. If IsConstructor(C) is true, then
      // 13. a. Let A be the result of calling the [[Construct]] internal method
      // of C with an argument list containing the single item len.
      // 14. a. Else, Let A be ArrayCreate(len).
      var A = isCallable(C) ? Object(new C(len)) : new Array(len);

      // 16. Let k be 0.
      var k = 0;
      // 17. Repeat, while k < len… (also steps a - h)
      var kValue;
      while (k < len) {
        kValue = items[k];
        if (mapFn) {
          A[k] = typeof T === 'undefined' ? mapFn(kValue, k) : mapFn.call(T, kValue, k);
        } else {
          A[k] = kValue;
        }
        k += 1;
      }
      // 18. Let putStatus be Put(A, "length", len, true).
      A.length = len;
      // 20. Return A.
      return A;
    };
  }();
}
// https://tc39.github.io/ecma262/#sec-array.prototype.find
if (!Array.prototype.find) {
  Object.defineProperty(Array.prototype, 'find', {
    value: function value(predicate) {
      // 1. Let O be ? ToObject(this value).
      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }

      var o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;

      // 3. If IsCallable(predicate) is false, throw a TypeError exception.
      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
      }

      // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
      var thisArg = arguments[1];

      // 5. Let k be 0.
      var k = 0;

      // 6. Repeat, while k < len
      while (k < len) {
        // a. Let Pk be ! ToString(k).
        // b. Let kValue be ? Get(O, Pk).
        // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
        // d. If testResult is true, return kValue.
        var kValue = o[k];
        if (predicate.call(thisArg, kValue, k, o)) {
          return kValue;
        }
        // e. Increase k by 1.
        k++;
      }

      // 7. Return undefined.
      return undefined;
    }
  });
}
_neo.trace = {
  browser: {
    is: {
      chrome: function chrome(userAgent) {
        var ua = userAgent || navigator.userAgent;

        return (/Chrome/.test(ua) && /Safari/.test(ua) && /AppleWebKit/.test(ua) && !/OPR/.test(ua) && !/Edge/.test(ua)
        );
      },
      edge: function edge(userAgent) {
        var ua = userAgent || navigator.userAgent;

        return (/Edge/.test(ua)
        );
      },
      firefox: function firefox(userAgent) {
        var ua = userAgent || navigator.userAgent;

        return (/Firefox/.test(ua)
        );
      },
      ie: function ie(userAgent) {
        var ua = userAgent || navigator.userAgent;

        return (/MSIE/.test(ua) || /IE/.test(ua) || /rv:11/.test(ua)
        );
      },
      opera: function opera(userAgent) {
        var ua = userAgent || navigator.userAgent;

        return (/Opera/.test(ua) || /OPR/.test(ua) || /Oupeng/.test(ua)
        );
      },
      safari: function safari(userAgent) {
        var ua = userAgent || navigator.userAgent;

        return (/Safari/.test(ua) && !/Chrome/.test(ua) && !/Oupeng/.test(ua)
        );
      }
    },
    detect: function detect(userAgent) {
      var name = 'other'; // default to unknown

      if (_neo.trace.browser.is.chrome(userAgent)) {
        name = 'chrome';
      }

      if (_neo.trace.browser.is.edge(userAgent)) {
        name = 'edge';
      }

      if (_neo.trace.browser.is.firefox(userAgent)) {
        name = 'firefox';
      }

      if (_neo.trace.browser.is.ie(userAgent)) {
        name = 'ie';
      }

      if (_neo.trace.browser.is.opera(userAgent)) {
        name = 'opera';
      }

      if (_neo.trace.browser.is.safari(userAgent)) {
        name = 'safari';
      }

      return name;
    }
  }
};
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _this = this;

/**
* Utilities object of getters & setters & callers
*/

_neo.jackin = function () {
  function isSwimmerInLane(swimmer, lanes) {
    var isBetween = function isBetween(n, lowerBound, upperBound) {
      return Math.max(Math.min(n, upperBound), lowerBound) === Number(n);
    };

    return Array.isArray(lanes[0]) ? lanes.some(function (lane) {
      return isBetween(swimmer, lane[0], lane[1]);
    }) : isBetween(swimmer, lanes[0], lanes[1]);
  }

  return {
    /**
     * requires a cookie name
     *
     * @method _neo.jackin.getCookie(sKey)
     * @returns {String}
     */
    getCookie: function getCookie(sKey) {
      if (!sKey) {
        return null;
      }

      return decodeURIComponent(document.cookie.replace(new RegExp('(?:(?:^|.*;)\\s*' + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, '\\$&') + '\\s*\\=\\s*([^;]*).*$)|^.*$'), '$1')) || null;
    },

    /**
     * requires a cookie name, value, expiration, path, and domain
     *
     * @method _neo.jackin.setCookie(sKey, sValue, vEnd, sPath, sDomain)
     * @returns {Boolean} false if sKey isn't passed, returns true is successful
     */
    setCookie: function setCookie(sKey, sValue, vEnd, sPath, sDomain, bSecure) {
      if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) {
        return false;
      }

      var sExpires = '';

      if (vEnd) {
        switch (vEnd.constructor) {
          case Number:
            sExpires = vEnd === Infinity ? '; expires=Fri, 31 Dec 9999 23:59:59 GMT' : '; max-age=' + vEnd;
            break;
          case String:
            var cDate = new Date();

            cDate.setTime(cDate.getTime() + 1.8e+6);
            sExpires = vEnd.toLowerCase() === 'session' ? '; expires=' + cDate.toUTCString() : '; expires=' + vEnd;
            break;
          case Date:
            sExpires = '; expires=' + vEnd.toUTCString();
            break;
        }

        var dmn = sDomain ? '; domain=' + sDomain : '';
        var pth = sPath ? '; path=' + sPath : '';
        var bSec = bSecure ? '; secure' : '';

        document.cookie = encodeURIComponent(sKey) + '=' + encodeURIComponent(sValue) + sExpires + dmn + pth + bSec;

        return true;
      }
    },

    /**
     * requires a cookie name
     * optional params are path, and domain
     *
     * @method _neo.jackin.removeCookie(sKey, sPath, sDomain)
     * @returns {Boolean} false if sKey isn't passed, returns true is successful
     */
    removeCookie: function removeCookie(cKey) {
      var cPath = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '/';
      var cDomain = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '.nike.com';

      var cookieToRemove = _neo.jackin.getCookie(cKey);
      var pastDate = 'Thu, 01 Jan 1970 00:00:00 UTC';

      if (cookieToRemove) {
        return _neo.jackin.setCookie(cKey, 1, pastDate, cPath, cDomain);
      }

      return false;
    },

    /**
     * used for sample rates and swimlanes
     *
     * @method _neo.jackin.getSample()
     * @returns {Number} random number between 0 - 99
     */
    getSample: function getSample() {
      return Math.floor(Math.random() * 100);
    },

    /**
     * requires name and URL
     *
     * @method _neo.jackin.getQueryParameter
     * @returns {String} value of name=value pair
     */
    getQueryParameter: function getQueryParameter(name) {
      var pageURL = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : window.location.href;

      if (pageURL) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        var results = regex.exec(pageURL);

        if (results === null) {
          return null;
        }

        return decodeURIComponent(results[1].replace(/\+/g, ' '));
      }

      return null;
    },

    newRelicReportEdm: function newRelicReportEdm(program) {
      var selectedVariant = program.selected_variant;
      var newRelicEdmData = {
        neoProgramId: program.id,
        neoProgramName: program.name,
        neoProgramPersist: program.persist,
        neoProgramPrivacy: program.privacy,
        neoProgramCountry: typeof program.qual.country === 'string' ? program.qual.country : 'all',
        neoProgramVariant: selectedVariant,
        neoProgramVariantLane: program.variants[selectedVariant].lanes[0] + ' - ' + program.variants[selectedVariant].lanes[1]
      };

      _neo.nebu('neo_edm', newRelicEdmData);
    },
    /**
     * requires program and construct
     *
     * @method _neo.jackin.edm(program, construct)
     * @returns {Boolean} True if successful
     */
    edm: function edm(program, construct, viewEvent) {
      try {
        program.variants[program.selected_variant].dm(program, construct, viewEvent);
        _neo.oracle.bakeCookie(program, construct);
        _neo.jackin.newRelicReportEdm(program);

        return true;
      } catch (e) {
        var edmData = {
          programId: program.id,
          curVariant: program.selected_variant,
          errorMessage: e.message
        };

        _neo.nebu('jackin.edm-error', edmData);

        throw e;
      }
    },

    /**
     * requires nothing
     *
     * @method _neo.jackin.generateUUID()
     * @returns {String} with 16 digit UUID
     */

    generateUUID: function generateUUID() {
      var d = new Date().getTime();

      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;

        d = Math.floor(d / 16);

        return (c == 'x' ? r : r & 0x7 | 0x8).toString(16);
      });
    },

    /**
     *
     * @returns {*} returns string if successful, if not, false
     */
    rootDomain: function rootDomain() {
      var hnArray = window.location.hostname.toLowerCase().split('.');

      return hnArray[hnArray.length - 1] && hnArray[hnArray.length - 2] ? '.' + hnArray[hnArray.length - 2] + '.' + hnArray[hnArray.length - 1] : false;
    },

    /**
     * @method _neo.jackin.getImgSrc(imageFileName)
     * @returns {String} with 16 digit UUID
     */
    getImgSrc: function getImgSrc(imageFileName) {
      if (imageFileName) {
        var testImg = 'https://test-web.nike.com/neo/img/' + imageFileName;
        var prodImg = 'https://web.nike.com/neo/img/' + imageFileName;

        return (/ecn|nikedev/.test(window.location.hostname) ? testImg : prodImg
        );
      }

      return null;
    },

    /**
     * @method _neo.jackin.getFromObject()
     * @param obj {Object} The root object to dig into
     * @param path {String} The path to the property that should be returned
     * @param defaultValue {*} The value to return if the root object or any
     *        step on the path to the final value does not exist
     *
     * @returns {*} Returns the value found at the end of the path passed, or
     *        the passed defaultValue
     *
     * @example Given window.foo = { bar : { baz : 1 } }, then
     *        _neo.jackin.getFromObject(window, 'foo.bar.baz', 3)
     *        // returns 1
     *
     * @example Given window.foo = { bar : { baz : 1 } }, then
     *        _neo.jackin.getFromObject(window, 'foo.baz', 3)
     *        // returns 3
     */
    getFromObject: function getFromObject(obj, path) {
      var defaultValue = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;

      if (obj === undefined || typeof path !== 'string') {
        return defaultValue;
      }
      if (path === '') {
        return obj;
      }

      return _neo.jackin.getFromObject(obj[path.split('.')[0]], path.split('.').slice(1).join('.'), defaultValue);
    },

    waitForObjectPresent: function waitForObjectPresent() {
      var obj = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _this;
      var path = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
      var time = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 5000;
      return new Promise(function (resolve, reject) {
        if (typeof path !== 'string') {
          reject({ error: 'First parameter expected string (object chain), received ' + (typeof path === 'undefined' ? 'undefined' : _typeof(path)) });
        }
        if ((typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) !== 'object') {
          reject({ error: 'First parameter expected to exist (object chain), received ' + (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) });
        }
        if (typeof time !== 'number') {
          reject({ error: 'Second parameter expected number (milliseconds), received ' + (typeof time === 'undefined' ? 'undefined' : _typeof(time)) });
        }

        var msDelay = 100;
        var pathArray = path.split('.');
        var currentIndex = 0;
        var attempt = 0;

        function testObjectSegment(o, p) {
          var currentObject = _neo.jackin.getFromObject(o, p);

          if (currentObject) {
            currentIndex += 1;
            if (currentIndex >= pathArray.length) {
              resolve({ value: currentObject });
            } else {
              testObjectSegment(currentObject, pathArray[currentIndex]);
            }
          } else if (attempt * msDelay <= time) {
            attempt += 1;
            window.setTimeout(function () {
              testObjectSegment(o, p);
            }, msDelay);
          } else {
            reject({ error: '\'' + path + '\' not present after ' + time + ' ms' });
          }
        }

        var getFromObject = _neo.jackin.getFromObject(obj, path);

        if (getFromObject) {
          // The entire object chain is immediately available.
          resolve({ value: getFromObject });
        } else {
          // Otherwise begin testing each segment of the chain.
          testObjectSegment(obj, pathArray[currentIndex]);
        }
      });
    },

    waitForCookiePresentNeverTimeout: function waitForCookiePresentNeverTimeout(cookieName) {
      return new Promise(function (resolve) {
        var interval = window.setInterval(function () {
          if (_neo.jackin.getCookie(cookieName) !== null) {
            clearInterval(interval);
            resolve(true);
          }
        }, 1000);
      });
    },
    waitForElementPresent: function waitForElementPresent(selector) {
      var time = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 5000;
      return new Promise(function (resolve, reject) {
        if (typeof selector !== 'string') {
          reject({ error: 'First parameter expected string (css selector), received ' + (typeof selector === 'undefined' ? 'undefined' : _typeof(selector)) });
        }
        if (typeof time !== 'number') {
          reject({ error: 'Second parameter expected number (milliseconds), received ' + (typeof time === 'undefined' ? 'undefined' : _typeof(time)) });
        }

        var msDelay = 100;
        var attempt = 0;

        var getNode = function getNode() {
          attempt += 1;

          return document.querySelector(selector);
        };

        if (getNode()) {
          resolve({ node: getNode() });
        } else {
          var interval = window.setInterval(function () {
            if (getNode()) {
              clearInterval(interval);
              resolve({ node: getNode() });
            } else if (attempt * msDelay > time) {
              clearInterval(interval);
              reject({ error: 'Dom node "' + selector + '" not present after ' + time + ' ms' });
            }
          }, msDelay);
        }
      });
    },
    isSwimmerInLane: isSwimmerInLane,
    getVariantBySwimlane: function getVariantBySwimlane(program, lane) {
      try {
        var variants = program.variants;


        if (!(lane && variants)) return;

        var variantKeys = Object.keys(variants);

        return variantKeys.find(function (key) {
          return isSwimmerInLane(lane, variants[key].lanes);
        });
      } catch (e) {
        _neo.nebu('jackin:getVariantBySwimlane error', e);

        return null;
      }
    },
    JSONP: function () {
      var unique = 0;

      return function (url, callback, context) {
        // create unique name to set in global scope
        var name = '_jsonp_' + (unique += 1);

        // make clear in url that this is a jsonp request
        if (url.match(/\?/)) {
          url += '&jsonp=' + name;
        } else {
          url += '?jsonp=' + name;
        }

        // Create script element
        var script = document.createElement('script');

        script.type = 'text/javascript';
        script.async = true;
        script.src = url;

        // Setup handler
        window[name] = function (data) {
          callback.call(context || window, data);
          document.body.removeChild(script);
          script = null;
          delete window[name];
        };

        // Load script and make request
        document.body.appendChild(script);
      };
    }()
  };
}();
/**
 * Utilities object to get privacy settings
 *
 * @type {{isEU: (()), isFPAllowed: (()), isAdAllowed: (())}}
 */
_neo.cypher = {
  /**
   * requires nothing
   *
   * @method _neo.cypher.isEU()
   * @returns {Boolean}
   */
  isEU: function isEU() {
    var geos = ['gb', 'fr', 'es', 'de', 'dk', 'fi', 'se', 'ie', 'be', 'nl', 'it', 'eu', 'cz', 'gr', 'hu', 'lu', 'at', 'pl', 'pt', 'si', 'la', 'no', 'ch', 'gr', 'ro', 'sk', 'si'];

    if (typeof nike !== 'undefined' && typeof nike.IS_EU !== 'undefined') {
      // DAT-1987 hot fix for Croatia privacy settings
      if (_neo.construct().country === 'hr') {
        nike.IS_EU = true;
      }

      // for main, mobile, ocp, id
      return nike.IS_EU;
    }

    // default to true
    return geos.indexOf(_neo.construct().country) > -1;
  },
  /**
   * requires a cookie name
   *
   * @method _neo.cypher.isFPAllowed()
   * @returns {Boolean}
   */
  isFPAllowed: function isFPAllowed() {
    if (_neo.cypher.isEU()) {
      var sq = _neo.jackin.getCookie('sq');

      if (sq === null) {
        return false;
      }

      return sq === '1' || sq === '3';
    }

    return true;
  },
  /**
   * requires a cookie name
   *
   * @method _neo.cypher.isAdAllowed()
   * @returns {Boolean}
   */
  isAdAllowed: function isAdAllowed() {
    if (_neo.cypher.isEU()) {
      var sq = _neo.jackin.getCookie('sq');

      if (sq === null) {
        return false;
      }

      return sq === '2' || sq === '3';
    }

    return true;
  }
};
/**
 *
 * @param url
 * @param tagElement
 * @param docElement
 * @param listener
 * @param tagId
 * @param loadOnce (boolean) - prevent din from fetching tags that already exist on the DOM.
 * @returns {boolean}
 */
_neo.din = function (url, tagElement, docElement, listener, tagId, loadOnce) {
  if (tagElement === 'image' && typeof url === 'string') {
    var newImg = new Image();

    newImg.addEventListener('load', function (e) {
      if (e && e.path && e.path[0]) {
        _neo.nebu('din', 'Image added: ' + e.path[0].src);
      }
    });
    newImg.src = url;

    // so we don't append to DOM below
    return true;
  }

  if (document && document.getElementsByTagName(docElement).length > 0) {
    var tag = document.createElement(tagElement);

    if (tagElement === 'script') {
      tag.type = 'text/javascript';
      tag.async = true;
      tag.src = url;
      if (tagId && typeof tagId === 'string') {
        tag.className = tagId;
      }
    } else if (tagElement === 'link') {
      tag.rel = 'stylesheet';
      tag.type = 'text/css';
      tag.href = url;
      if (tagId && typeof tagId === 'string') {
        tag.className = tagId;
      }
    } else if (tagElement === 'iframe') {
      tag.style.display = 'none';
      tag.src = url;
      if (tagId && typeof tagId === 'string') {
        tag.className = tagId;
      }
    } else {
      return false;
    }

    if (typeof listener === 'function') {
      tag.addEventListener('load', listener);
    }
    // Special behavior for elements whose tagIds already exist on the page
    if (tagId && typeof tagId === 'string' && document && document.querySelectorAll(tagElement + '.' + tagId)[0]) {
      // If din is called with loadOnce as true, do not update the href/src.
      if (loadOnce) {
        return false;
      }
      // Otherwise, handle the duplicate din without creating a new element.
      if (tagElement === 'link') {
        document.querySelectorAll(tagElement + '.' + tagId)[0].href = url;
      } else {
        document.querySelectorAll(tagElement + '.' + tagId)[0].src = url;
      }
    } else {
      document.getElementsByTagName(docElement)[0].appendChild(tag);
    }

    return true;
  }

  return false;
};
/**
 * dispatchEvents
 *
 * @method _neo.mouse(msg)
 * @returns
 */
_neo.mouse = function (msg) {
  // CustomEvent polyfill for IE9+
  (function () {
    if (typeof window.CustomEvent === 'function') {
      return false;
    }

    function CustomEvent(event, params) {
      params = params || { bubbles: false, cancelable: false, detail: undefined };
      var evt = document.createEvent('CustomEvent');

      evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);

      return evt;
    }
    CustomEvent.prototype = window.Event.prototype;
    window.CustomEvent = CustomEvent;
  })();

  // end polyfill

  if (window.newrelic) {
    if (msg.fnName.indexOf('error') > -1) {
      window.newrelic.addPageAction('neoErrorEvent', msg);
      console.warn(msg);
    } else if (msg.fnName === 'construct_tracking') {
      window.newrelic.addPageAction('neoConstructEvent', msg);
    } else if (msg.fnName === 'neo_rum') {
      window.newrelic.addPageAction('neoRumEvent', msg);
    } else if (msg.fnName === 'neo_edm') {
      window.newrelic.addPageAction('neoEdmEvent', msg);
    }
  }
};
/**
 * safeUrl is used to stop tags firing on pages that include PII in url or referer
 */

_neo.safeUrl = function () {
  var urls = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [window.location.href, document.referrer];

  // check the url for format like 'email@address.com', 'email%40address.com', 'email@2540address.com', etc.
  var matcher = /(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))(?:@|%(?:(25)*)40)(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})/gi;

  return !urls.filter(function (u) {
    return matcher.test(u);
  }).length;
};
/**
 * DAT-1844: Make switchbard
 *  *******IMPORTANT****** MUST BE USED AFTER analyticsSupportReady EVENT
 * ex: invoke with _neo.switchboard.pdp.inline() to return true or false as to current page.
 */
_neo.switchboard = {
  pdp_desktop: {
    inline: {
      qual: {
        node: function node() {
          var builder = void 0;
          var dPid = void 0;
          var gcard = void 0;
          var coming = void 0;
          var cp = void 0;
          var inStock = void 0;
          var message = void 0;
          var soldOut = void 0;

          window.nike && nike.exp && nike.exp.pdp && nike.exp.pdp.PdpPage && nike.exp.pdp.PdpPage.currentProduct && nike.exp.pdp.PdpPage.currentProduct ? cp = nike.exp.pdp.PdpPage.currentProduct : cp = false;

          if (!cp) {
            return false;
          }

          window.nike && nike.idbuilderpdp ? builder = true : builder = false;

          cp.digitalPiD ? dPid = cp.digitalPiD : dPid = false;

          window.nike && nike.analytics && nike.analytics.currentPageId && nike.analytics.currentPageId === 'giftCardPdp' ? gcard = true : gcard = false;

          cp.showComingSoonMessage ? coming = nike.exp.pdp.PdpPage.currentProduct.showComingSoonMessage : coming = false;

          cp.inStock ? inStock = cp.inStock : inStock = '';

          cp.showOutOfStockMessage ? message = cp.showOutOfStockMessage : message = false;

          message || !inStock ? soldOut = true : soldOut = false;

          return (/\/pd\//.test(window.location.pathname) && cp && !builder && !dPid && !gcard && !coming && !soldOut
          );
        }
      }
    },

    id: {
      qual: {
        node: function node() {
          if (window.nike) {
            return (/\/product\//.test(window.location.pathname)
            );
          }
        }
      }
    },

    dpid: {
      qual: {
        node: function node() {
          var dPid = void 0;

          window.nike && nike.exp && nike.exp.pdp && nike.exp.pdp.PdpPage && nike.exp.pdp.PdpPage.currentProduct && nike.exp.pdp.PdpPage.currentProduct.digitalPiD ? dPid = nike.exp.pdp.PdpPage.currentProduct.digitalPiD : dPid = false;

          return (/\/pd\//.test(window.location.pathname) && dPid
          );
        }
      }
    },

    giftcard: {
      qual: {
        node: function node() {
          var gcard = void 0;

          window.nike && nike.analytics && nike.analytics.currentPageId && nike.analytics.currentPageId === 'giftCardPdp' ? gcard = true : gcard = false;

          return (/\/pd\//.test(window.location.pathname) && gcard
          );
        }
      }
    },

    comingsoon: {
      qual: {
        node: function node() {
          var coming = void 0;

          window.nike && nike.exp && nike.exp.pdp && nike.exp.pdp.PdpPage && nike.exp.pdp.PdpPage.currentProduct && nike.exp.pdp.PdpPage.currentProduct.showComingSoonMessage ? coming = nike.exp.pdp.PdpPage.currentProduct.showComingSoonMessage : coming = false;

          return (/\/pd\//.test(window.location.pathname) && coming
          );
        }
      }
    },

    soldout: {
      qual: {
        node: function node() {
          var inStock = void 0;
          var cp = void 0;
          var message = void 0;

          if (window.nike && nike.exp && nike.exp.pdp && nike.exp.pdp.PdpPage && nike.exp.pdp.PdpPage.currentProduct && nike.exp.pdp.PdpPage.currentProduct) {
            cp = nike.exp.pdp.PdpPage.currentProduct;

            cp.inStock ? inStock = cp.inStock : inStock = '';

            cp.showOutOfStockMessage ? message = cp.showOutOfStockMessage : message = false;
          } else {
            cp = false;
            inStock = '';
            message = false;
          }

          return (/\/pd\//.test(window.location.pathname) && cp && !inStock && message
          );
        }
      }
    },

    all_pdp: {
      qual: {
        node: function node() {
          var type = _neo.switchboard.pdp_desktop;

          return type.inline.qual.node() || type.id.qual.node() || type.dpid.qual.node() || type.giftcard.qual.node() || type.comingsoon.qual.node() || type.soldout.qual.node();
        }
      }
    },

    all_pdp_except_id: {
      qual: {
        node: function node() {
          var type = _neo.switchboard.pdp_desktop;

          return type.inline.qual.node() || type.dpid.qual.node() || type.giftcard.qual.node() || type.comingsoon.qual.node() || type.soldout.qual.node();
        }
      }
    }
  },

  pdp_mobile: {
    inline: {
      qual: {
        node: function node() {
          var builder = void 0;
          var dPid = void 0;
          var gcard = void 0;
          var coming = void 0;
          var cp = void 0;
          var inStock = void 0;
          var message = void 0;
          var soldOut = void 0;

          window.nike && nike.exp && nike.exp.pdp && nike.exp.pdp.mobile && nike.exp.pdp.mobile.PdpPage && nike.exp.pdp.mobile.PdpPage.pdpData ? cp = nike.exp.pdp.mobile.PdpPage.pdpData : cp = false;

          if (!cp) {
            return false;
          }

          _neo.jackin.getFromObject(window, 'nike.id.productData') ? builder = true : builder = false;

          cp.digitalPiD ? dPid = cp.digitalPiD : dPid = false;

          window.nike && nike.exp && nike.exp.pdp && nike.exp.pdp.mobile && nike.exp.pdp.mobile.giftCard ? gcard = true : gcard = false;

          cp.showComingSoonMessage ? coming = cp.showComingSoonMessage : coming = false;

          cp.inStock ? inStock = cp.inStock : inStock = '';

          cp.showOutOfStockMessage ? message = cp.showOutOfStockMessage : message = false;

          message || !inStock ? soldOut = true : soldOut = false;

          return (/\/pd\//.test(window.location.pathname) && cp && !builder && !dPid && !gcard && !coming && !soldOut
          );
        }
      }
    },

    id: {
      qual: {
        node: function node() {
          if (window.nike) {
            return (/\/product\//.test(window.location.pathname)
            );
          }
        }
      }
    },

    dpid: {
      qual: {
        node: function node() {
          var dPid = void 0;

          window.nike && nike.exp && nike.exp.pdp && nike.exp.pdp.mobile && nike.exp.pdp.mobile.PdpPage && nike.exp.pdp.mobile.PdpPage.pdpData && nike.exp.pdp.mobile.PdpPage.pdpData.digitalPiD ? dPid = nike.exp.pdp.mobile.PdpPage.pdpData.digitalPiD : dPid = false;

          return (/\/pd\//.test(window.location.pathname) && dPid
          );
        }
      }
    },

    giftcard: {
      qual: {
        node: function node() {
          var gcard = void 0;

          window.nike && nike.exp && nike.exp.pdp && nike.exp.pdp.mobile && nike.exp.pdp.mobile.giftCard ? gcard = true : gcard = false;

          return (/\/pd\//.test(window.location.pathname) && gcard
          );
        }
      }
    },

    comingsoon: {
      qual: {
        node: function node() {
          var coming = void 0;

          window.nike && nike.exp && nike.exp.pdp && nike.exp.pdp.mobile && nike.exp.pdp.mobile.PdpPage && nike.exp.pdp.mobile.PdpPage.pdpData && nike.exp.pdp.mobile.PdpPage.pdpData.showComingSoonMessage ? coming = nike.exp.pdp.mobile.PdpPage.pdpData.showComingSoonMessage : coming = false;

          return (/\/pd\//.test(window.location.pathname) && coming
          );
        }
      }
    },

    soldout: {
      qual: {
        node: function node() {
          var inStock = void 0;
          var cp = void 0;
          var message = void 0;

          if (window.nike && nike.exp && nike.exp.pdp && nike.exp.pdp.mobile && nike.exp.pdp.mobile.PdpPage && nike.exp.pdp.mobile.PdpPage.pdpData) {
            cp = nike.exp.pdp.mobile.PdpPage.pdpData;

            cp.inStock ? inStock = cp.inStock : inStock = '';

            cp.showOutOfStockMessage ? message = cp.showOutOfStockMessage : message = false;
          } else {
            cp = false;
            inStock = '';
            message = false;
          }

          return (/\/pd\//.test(window.location.pathname) && cp && !inStock && message
          );
        }
      }
    },

    all_pdp: {
      qual: {
        node: function node() {
          var type = _neo.switchboard.pdp_mobile;

          return type.inline.qual.node() || type.id.qual.node() || type.dpid.qual.node() || type.giftcard.qual.node() || type.comingsoon.qual.node() || type.soldout.qual.node();
        }
      }
    },

    all_pdp_except_id: {
      qual: {
        node: function node() {
          var type = _neo.switchboard.pdp_mobile;

          return type.inline.qual.node() || type.dpid.qual.node() || type.giftcard.qual.node() || type.comingsoon.qual.node() || type.soldout.qual.node();
        }
      }
    }
  },

  pw: {
    qual: {
      node: function node() {
        return (/\/pw\//.test(window.location.pathname)
        );
      }
    }
  },

  store_home: {
    qual: {
      node: function node() {
        var construct = _neo.construct();
        var pathname = '/' + construct.country + '/' + construct.language + '/';

        return window.location.hostname === 'store.nike.com' && window.location.pathname.split('/').length === 4 && window.location.pathname === pathname;
      }
    }
  },

  giftcards_land: {
    qual: {
      node: function node() {
        return window.location.pathname.split('/').length === 4 && /\?l=shop%2Cgift_cards|\?l=shop,gift_cards/.test(window.location.search);
      }
    }
  },

  email_signup: {
    qual: {
      node: function node() {
        return window.location.pathname.split('/').length === 4 && /\?l=shop%2Cemail_signup|\?l=shop,email_signup/.test(window.location.search);
      }
    }
  },

  slp: {
    qual: {
      node: function node() {
        return (/\/c\//.test(window.location.pathname) && typeof window.location.pathname.split('/')[5] === 'undefined'
        );
      }
    }
  },

  cdp: {
    qual: {
      node: function node() {
        return (/\/c\//.test(window.location.pathname) && typeof window.location.pathname.split('/')[5] !== 'undefined'
        );
      }
    }
  },

  nike_home: {
    qual: {
      node: function node() {
        var construct = _neo.construct();
        var pathname = '/' + construct.country + '/' + construct.language + '/';

        return (/www\.nike\.com|m\.nike\.com/.test(window.location.hostname) && window.location.pathname.split('/').length === 4 && window.location.pathname === pathname
        );
      }
    }
  },

  registration: {
    qual: {
      node: function node() {
        return window.location.pathname.split('/')[4] === 'register';
      }
    }
  },

  store_locator: {
    qual: {
      node: function node() {
        return (/store-locator/.test(window.location.pathname)
        );
      }
    }
  },

  cities: {
    qual: {
      node: function node() {
        return window.location.pathname.split('/')[3] === 'e' && window.location.pathname.split('/')[4] === 'cities';
      }
    }
  },

  cart: {
    qual: {
      node: function node() {
        if (window._neo && _neo.ocp) {
          return window.location.pathname.split('/')[4] === 'cart.jsp';
        }

        return false;
      }
    }
  },

  checkout_login: {
    qual: {
      node: function node() {
        if (window._neo && _neo.ocp) {
          return window.location.pathname.split('/')[4] === 'checkout_login.jsp';
        }

        return false;
      }
    }
  },

  ocp_shipping: {
    qual: {
      node: function node() {
        if (window._neo && _neo.ocp) {
          return window.location.pathname.split('/')[4] === 'shipping.jsp';
        }

        return false;
      }
    }
  },

  ocp_billing: {
    qual: {
      node: function node() {
        if (window._neo && _neo.ocp) {
          return window.location.pathname.split('/')[4] === 'billing.jsp';
        }

        return false;
      }
    }
  },

  ocp_review: {
    qual: {
      node: function node() {
        if (window._neo && _neo.ocp) {
          return window.location.pathname.split('/')[4] === 'review.jsp';
        }

        return false;
      }
    }
  },

  ocp_confirm: {
    qual: {
      node: function node() {
        if (window._neo && _neo.ocp) {
          return window.location.pathname.split('/')[4] === 'confirm.jsp';
        }

        return false;
      }
    }
  },

  gs_checkout: {
    qual: {
      node: function node() {
        if (window._neo && _neo.globalstore) {
          return window.esw && !window.esw.PaymentAttempt;
        }

        return false;
      }
    }
  },

  gs_confirm: {
    qual: {
      node: function node() {
        return (window.location.hostname.indexOf('secure-global.nike.com') !== -1 || window.location.hostname.indexOf('secure-global.nikedev.com') !== -1) && window.esw && window.esw.PaymentAttempt && window.esw.PaymentAttempt.Result === 'Success';
      }

    }
  }
};
var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 * fills payload and console logs
 *
 * @method _neo.nebu(fnName, message)
 * @returns
 */
_neo.nebu = function (fnName, message) {
  var msg = {
    timestamp: Date.now(),
    fnName: fnName,
    version_id: '4.779.0',
    profile_id: 'thirdparty'
  };

  if ((typeof message === 'undefined' ? 'undefined' : _typeof(message)) === 'object') {
    _extends(msg, message);
  } else {
    msg.message = message;
  }

  if (!_neo.analytics_ready) {
    _neo.payload = _neo.payload || [];
    // load up the nebu for dreams transport
    _neo.payload.push(msg);
  }
  // dispatchEvent
  _neo.mouse(msg);

  // console.log statements if neo.debug cookie is set
  if (_neo.jackin.getCookie('neo.debug')) {
    window.console.log('----' + msg.timestamp + '----' + msg.fnName + '----', msg.message);
  }
};
/**
 *
 * @type {{cookieName: string, bakeCookie: ((p1:*, p2:*)), rightAsRain: ((p1:*))}}
 */
_neo.oracle = {
  cookieName: 'neo.experiments',

  // Set the currently iterated matrix program into a cookie if persisted
  bakeCookie: function bakeCookie(program, construct) {
    _neo.nebu('oracle', 'copy');

    if (program.persist) {
      // get json object from the current cookie
      var cookieValue = JSON.parse(_neo.jackin.getCookie(_neo.oracle.cookieName)) || {};

      // make sure there is an object for the profile
      if (!cookieValue[construct.env]) {
        cookieValue[construct.env] = {};
      }

      // set program id and variant into an object within the profile object.
      cookieValue[construct.env][program.id] = program.selected_variant;

      // write the cookie
      _neo.jackin.setCookie(_neo.oracle.cookieName, JSON.stringify(cookieValue), construct.persist_period, '/', construct.host_name);

      _neo.nebu('oracle', 'persisted ' + _neo.oracle.cookieName + '=' + JSON.stringify(cookieValue));
    }

    // already persisted
    if (!program.persist) {
      _neo.nebu('oracle', 'opted out or previously persisted { ' + program.id + ' ' + construct.var_delim + ' ' + program.selected_variant + ' }');
    }
  },

  // clean out all old matrix programs from the cookie, only for the current profile
  rightAsRain: function rightAsRain(construct) {
    // array of all
    var allMatrixProgramIds = construct.all_programs.map(function (program) {
      return program.id;
    });

    // get the current value of the existing cookie
    var cookieValue = JSON.parse(_neo.jackin.getCookie(_neo.oracle.cookieName));

    if (!cookieValue[construct.env]) {
      _neo.oracle.initializeCookie(construct);
    }

    // make a list of all programs that are in the cookie, that are also in the active matrix program list
    var profilePrograms = Object.keys(cookieValue[construct.env]).filter(function (cookieProgram) {
      return allMatrixProgramIds.indexOf(cookieProgram) !== -1;
    }).map(function (program) {
      return program;
    });

    // delete any vestigial programs from the cookie
    Object.keys(cookieValue[construct.env]).forEach(function (cookieProgram) {
      if (profilePrograms.indexOf(cookieProgram) === -1) {
        delete cookieValue[construct.env][cookieProgram];
      }
    });

    construct.all_programs.forEach(function (program) {
      var correctVariant = _neo.jackin.getVariantBySwimlane(program, construct.swimlane);

      if (correctVariant && cookieValue[construct.env] && cookieValue[construct.env][program.id] && cookieValue[construct.env][program.id] !== correctVariant) {
        _neo.nebu('oracle.rightAsRain detected a variant lane conflict and has righted the rain');
        cookieValue[construct.env][program.id] = correctVariant;
      }
    });

    // write the cookie
    _neo.jackin.setCookie(_neo.oracle.cookieName, JSON.stringify(cookieValue), construct.persist_period, '/', construct.host_name);
  },

  // Make sure the cookie exists and is an object. Wipe out legacy cookie format if it exists.
  initializeCookie: function initializeCookie(construct) {
    var cookie = _neo.jackin.getCookie(_neo.oracle.cookieName);
    var newCookie = {};

    // try to parse the cookie into JSON
    if (cookie !== null) {
      try {
        newCookie = JSON.parse(cookie);
      } catch (e) {
        // do nothing
      }
    }

    // if the cookie doesn't have the profile object, add it
    if (!newCookie[construct.env]) {
      newCookie[construct.env] = {};
    }

    // write the cookie
    _neo.jackin.setCookie(_neo.oracle.cookieName, JSON.stringify(newCookie), construct.persist_period, '/', construct.host_name);
  }
};
/**
 * Makes dm changes immediately or initiates listener.
 * Adds any associated SCSS file found as a css <style> tag.
 *
 * @method _neo.dozer(program, construct)
 * @param {Array} evpArray The array of programs that have qualified for this page session.
 * @param {Object} construct The construct for this NEO session.
 * @returns {Boolean} true if successful or false if exception
 */
_neo.dozer = function (evpArray, construct) {
  _neo.nebu('dozer', 'copy');

  evpArray.forEach(function (program) {
    // First check to see if there is stylesheet content associated with this program and env
    if (_neo.styles[construct.env][program.id]) {
      var programStyles = _neo.jackin.getFromObject(_neo.styles[construct.env], program.id, '');
      // The stylesheet is under either the program ID itself, or under the selected variant.
      var styleSheetText = typeof programStyles === 'string' ? programStyles : _neo.jackin.getFromObject(programStyles, program.selected_variant);

      // If we found a stylesheet, make a style tag to append to the body.
      if (styleSheetText) {
        var styleTag = document.createElement('style');

        styleTag.type = 'text/css';
        // Uniquely identify the style tag, populate it with the string CSS block, and append it to body.
        styleTag.id = 'neo-style-' + program.id + program.selected_variant;
        styleTag.innerHTML = styleSheetText;
        document.head.appendChild(styleTag);
      }
    }

    if (program.qual && program.qual.promise !== undefined && typeof program.qual.promise === 'function') {
      var promise = program.qual.promise;


      promise().then(function () {
        var obj = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

        _neo.nebu('dozer', program.id + ' qualified based on resolved promise: ' + obj);
        _neo.jackin.edm(program, construct, obj);
      }).catch(function (err) {
        _neo.nebu('dozer', program.id + ' not qualified based on rejected promise: ' + err.error);
      });
    } else if (program.qual.listener) {
      _neo.nebu('dozer', 'waiting for ' + program.qual.listener.type + ' ' + program.qual.listener.name + '\n          event for ' + program.id + construct.var_delim + program.selected_variant);

      // sets up nike event listener
      if (program.qual.listener.type === 'nike') {
        // sets up listener if sq cookie is not set
        nike.listen(program.qual.listener.name, function () {
          // waits for sq cookie to be set, then checks privacy settings
          if (program.qual.listener.name === 'nike.Event.TRACKING_USER_DATA_UPDATED') {
            var sq = _neo.jackin.getCookie('sq');

            if (program.privacy <= sq) {
              _neo.jackin.edm(program, construct);
            } else {
              _neo.nebu('dozer', program.id + ' not qualified by privacy cookie ' + program.privacy + ' > ' + sq);
            }
            // check for html node to qualify for program
          } else if (!program.qual.node || program.qual.node && program.qual.node()) {
            _neo.jackin.edm(program, construct);
          }
        });
        // sets up DOM event listener
      } else if (program.qual.listener.type === 'dom') {
        window.addEventListener(program.qual.listener.name, function (e) {
          if (!program.qual.listener.views || program.qual.listener.views && program.qual.listener.views.indexOf(e.detail.name) !== -1) {
            if (!program.qual.node || program.qual.node && program.qual.node()) {
              _neo.jackin.edm(program, construct, e);
            }
          }
        });
      }
    } else if (!program.qual.node || program.qual.node && program.qual.node()) {
      _neo.jackin.edm(program, construct);
    }
  });

  return true;
};
var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * checks for previous dm to persist programs and variants OR sets new programs and variants
 *
 * @method _neo.tank(qualifiedProgramsArray, construct)
 * @returns {Array} of programs with selected variants
 */
_neo.tank = function (qualifiedProgramsArray, construct) {
  _neo.nebu('tank', 'copy');
  var activeProgramArray = [];
  var previewProgramsArray = [];
  var evpArray = [];
  var allPreviews = construct.preview_programs.split(construct.program_delim).reduce(function (previews, currentPreview) {
    var previewInfo = currentPreview.split(construct.var_delim);
    var previewTitle = previewInfo[0];
    var previewVariant = previewInfo[1] || 'a';

    return previewTitle ? _extends({}, _defineProperty({}, previewTitle, previewVariant), previews) : previews;
  }, {});

  qualifiedProgramsArray.forEach(function (prog) {
    var program = Object.create(prog);

    // check if attempting a preview and set variant
    if (allPreviews[program.id]) {
      program.selected_variant = allPreviews[program.id];
      program.persist = 0;
      program.preview = 1;
      previewProgramsArray.push(program);
      _neo.nebu('tank', 'preview detected for ' + program.id + construct.var_delim + program.selected_variant);

      if (!_neo.jackin.isSwimmerInLane(construct.swimlane, program.variants[program.selected_variant].lanes)) {
        construct.swimlane = Array.isArray(program.variants[program.selected_variant].lanes[0]) ? program.variants[program.selected_variant].lanes[0][0] : program.variants[program.selected_variant].lanes[0];

        _neo.jackin.setCookie('neo.swimlane', construct.swimlane, construct.persist_period, '/', construct.host_name);

        _neo.nebu('tank', 'forcing swimlane to ' + construct.swimlane + '\n          for preview ' + program.id + construct.var_delim + program.selected_variant);
      }
      // check if previously qualified for program to set variant
    } else if (program.active && function () {
      try {
        return !!JSON.parse(construct.previous_programs)[construct.env][program.id];
      } catch (e) {
        _neo.nebu('tank', e);
      }

      return false;
    }()) {
      var previousPrograms = JSON.parse(construct.previous_programs);
      var correctVariant = _neo.jackin.getVariantBySwimlane(program, construct.swimlane) || previousPrograms[construct.env][program.id];

      program.selected_variant = correctVariant;
      program.persist = 0;
      activeProgramArray.push(program);
      _neo.nebu('tank', 'previous dm detected for ' + program.id + construct.var_delim + program.selected_variant);
      // find new variant by swimlane
    } else if (program.active) {
      Object.keys(program.variants).forEach(function (variant) {
        if (_neo.jackin.isSwimmerInLane(construct.swimlane, program.variants[variant].lanes)) {
          _neo.nebu('tank', 'new variant detected ' + program.id + construct.var_delim + variant);
          program.selected_variant = variant;
          if (typeof program.persist === 'undefined') {
            program.persist = 1;
          }
          activeProgramArray.push(program);

          // program disqualified by swimlane
        } else {
          _neo.nebu('tank', '' + program.id + construct.var_delim + variant + ' disqualified by swimlane');
        }
      });
    }
  });
  evpArray = activeProgramArray.concat(previewProgramsArray);
  _neo.nebu('tank', 'returning ' + evpArray.length + ' EVPs');

  return evpArray;
};
/**
 * qualifies programs in an array
 * using static vars from construct: country and pageURL
 *
 * @method _neo.morpheus(programsArray, construct)
 * @returns {Array} of qualified programs
 */
_neo.morpheus = function (programsArray, construct) {
  _neo.nebu('morpheus', 'copy');

  var qualifiedProgramsArray = [];

  programsArray.forEach(function (program) {
    // check for device, country, page qualifications
    var device = program.qual.device ? construct.device.match(program.qual.device) : 'all';
    var country = program.qual.country ? construct.country.match(program.qual.country) : 'all';
    var page = program.qual.page ? construct.pageURL.match(program.qual.page) : 'all';
    var browser = program.qual.browser ? construct.browser.match(program.qual.browser) : 'all';
    var node = program.qual.node ? !!program.qual.node() : 'all';

    _neo.nebu('morpheus', program.id + '\n      ' + (device && country && page && browser && node ? ' qualified for ' : ' NOT qualified for ') + '\n      ' + device + ' | ' + country + ' | ' + page + ' | ' + browser);
    if (device && country && page && browser && node && _neo.safeUrl()) {
      qualifiedProgramsArray.push(program);
    }
  });
  _neo.nebu('morpheus', 'returning ' + qualifiedProgramsArray.length + ' qualified programs');

  return qualifiedProgramsArray;
};
var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * Prioritizes Preview programs if present, returns array of all programs.
 *
 * @method _neo.trinity(construct)
 * @return {Array} of all programs with indicated preview programs before live programs
 */
_neo.trinity = function (construct) {
  _neo.nebu('trinity', 'copy');
  var liveProgramsArray = [];
  var previewProgramsArray = [];
  var programsArray = [];
  var sq = _neo.jackin.getCookie('sq');
  var isEU = _neo.cypher.isEU();
  var isFPAllowed = _neo.cypher.isFPAllowed();
  var isAdAllowed = _neo.cypher.isAdAllowed();
  var allPreviews = construct.preview_programs.split(construct.program_delim).reduce(function (previews, preview) {
    var previewTitle = preview.split(construct.var_delim)[0];

    return _extends({}, _defineProperty({}, previewTitle, true), previews);
  }, {});

  // build live and preview programs arrays.
  construct.all_programs.forEach(function (program) {
    // Programs identified as previews are pushed into the previews array; this will give them swimlane-setting power.
    if (allPreviews[program.id]) {
      _neo.nebu('trinity', 'preview program ' + program.id);
      previewProgramsArray.push(program);
    } else {
      // build live programs array
      _neo.nebu('trinity', 'program ' + program.id + ' is ' + (program.active ? 'active' : 'inactive'));

      // check to push programs that have privacy qual but no 'sq' cookie is set (new users)
      if (isEU && sq === null && program.privacy !== 0) {
        program.qual.listener = {};
        program.qual.listener.type = 'nike';
        program.qual.listener.name = 'nike.Event.TRACKING_USER_DATA_UPDATED';
        liveProgramsArray.push(program);
      }

      // push programs when 'sq' cookie is set
      if (typeof program.privacy === 'undefined' || program.privacy === 0 || program.privacy === 1 && isFPAllowed || program.privacy === 2 && isAdAllowed || program.privacy === 3 && isFPAllowed && isAdAllowed) {
        liveProgramsArray.push(program);
      }
    }
  });

  programsArray = previewProgramsArray.concat(liveProgramsArray);

  _neo.nebu('trinity', 'returning ' + liveProgramsArray.length + ' live and ' + previewProgramsArray.length + ' preview programs');

  return programsArray;
};
/**
 * construct object with static variables
 *
 * @method _neo.construct()
 * @returns {Object} or undefined if abTestDebug cookie exists
 */
_neo.construct = function () {
  _neo.nebu('construct', 'copy');
  var staticVars = {
    // version for analytics
    version_id: '4.779.0',

    // environment for env. specific requires
    env: 'thirdparty',

    // delimiter between programs
    program_delim: '|',

    // delimiter between variants
    var_delim: ':',

    // secs per day * days to persist same E:V
    persist_period: 86400 * 60,

    // get url for qualifications
    pageURL: window.location.href,

    // get root domain for setting cookies
    host_name: window.location.hostname.split('.').splice(1).join('.'),

    // get country from www cookie or use nike plus settings or blank string
    country: _neo.jackin.getCookie('NIKE_COMMERCE_COUNTRY') ? _neo.jackin.getCookie('NIKE_COMMERCE_COUNTRY').toLowerCase() : typeof np !== 'undefined' && np.settings && np.settings.country ? np.settings.country.toLowerCase() : '',

    // get lang locale from cookie
    language: _neo.jackin.getCookie('NIKE_COMMERCE_LANG_LOCALE') ? _neo.jackin.getCookie('NIKE_COMMERCE_LANG_LOCALE').toLowerCase() : '',

    // default device type
    device: 'desktop',

    // get current swimlane cookie or get random swimlane
    swimlane: _neo.jackin.getCookie('neo.swimlane') || '',

    // get matrix array
    all_programs: _neo.matrix || [],

    // get previously qualified programs
    previous_programs: _neo.jackin.getCookie('neo.experiments') || '',

    // get preview programs from query param OR cookie
    preview_programs: _neo.jackin.getQueryParameter('neo_preview', window.location.href) || _neo.jackin.getCookie('neo.preview') || ''
  };

  // device detection
  var isMobile = /iPhone|iPod|Windows Phone|IEMobile/i.test(navigator.userAgent) || /android.*mobile/i.test(navigator.userAgent) || /mozilla.*mobile.*firefox/i.test(navigator.userAgent);
  var isTablet = /ipad|android\s3/i.test(navigator.userAgent);

  if (isTablet) {
    staticVars.device = 'tablet';
  } else if (!isTablet && isMobile) {
    staticVars.device = 'phone';
  } else if (!isTablet && !isMobile && /android/i.test(navigator.userAgent)) {
    staticVars.device = 'tablet';
  }

  // browser detection, wrap in a function to facilitate testing
  staticVars.detectBrowser = function (ua) {
    return _neo.trace.browser.detect(ua);
  };

  staticVars.browser = staticVars.detectBrowser();

  // set new swimlane and persist
  if (staticVars.swimlane === '') {
    staticVars.swimlane = _neo.jackin.getSample();
    _neo.jackin.setCookie('neo.swimlane', staticVars.swimlane, staticVars.persist_period, '/', staticVars.host_name);
    _neo.nebu('construct', 'persisted new swimlane ' + staticVars.swimlane);

    var newRelicConstructData = {
      swimlane: staticVars.swimlane,
      version_id: staticVars.version_id,
      env: staticVars.env,
      country: staticVars.country,
      pageURL: staticVars.pageURL,
      language: staticVars.language,
      browser: staticVars.browser
    };

    _neo.nebu('construct_tracking', newRelicConstructData);
  }
  // persist preview program for an hour
  if (staticVars.preview_programs !== '') {
    _neo.jackin.setCookie('neo.preview', staticVars.preview_programs, 'session', '/', staticVars.host_name);
  }

  _neo.nebu('construct', 'version_id:' + staticVars.version_id + '\n     | country:' + staticVars.country + '\n     | device:' + staticVars.device + '\n     | browser:' + staticVars.browser + '\n     | swimlane:' + staticVars.swimlane + '\n     | previous programs:' + staticVars.previous_programs + '\n     | preview programs:' + staticVars.preview_programs);

  _neo.nebu('construct', 'returning ' + staticVars.all_programs.length + ' programs and static variables');

  return staticVars;
};
/**
 * main controller calling all support functions
 *
 * @method _neo.neo()
 * @return {Boolean} false if abTestDebug cookie exists, true otherwise
 */
_neo.neo = function () {
  if (!_neo.jackin.getCookie('abTestingDebug')) {
    if (!_neo.analytics_ready) {
      window.addEventListener('analytics.submodule_ready', function (e) {
        if (e.detail && e.detail.name && e.detail.name === 'dreamcatcher') {
          _neo.analytics_ready = true;
          _neo.payload.forEach(function (msg) {
            if (msg.profile_id === 'snkrs' && msg.fnName === 'neo_rum') {
              _neo.nebu('NEO-3614 - Prevent firing additional neo-rum events');
            } else {
              _neo.mouse(msg);
            }
          });
        }
      });
    }
    _neo.nebu('neo', 'construct');
    // build static variables
    var construct = _neo.construct();

    // initialize the neo.experimentscookie so it is present and properly formatted before
    // anything dependent upon it is run.
    _neo.oracle.initializeCookie(construct);

    // chain of events: trinity, morpheus, tank, dozer, oracle, dozer, oracle etc
    if (_neo.dozer(_neo.tank(_neo.morpheus(_neo.trinity(construct), construct), construct), construct)) {
      _neo.nebu('neo', 'programs complete');
      _neo.nebu('neo_rum', Date.now());
    }

    // clean up, remove any vestigial programs from the neo.experiments cookie
    _neo.oracle.rightAsRain(construct);

    return true;
  }

  // if abTestDebug set
  _neo.nebu('neo', 'abTestingDebug override');

  return false;
};
//Fri Feb 23 2018 00:27:11 GMT+0000 (UTC)
_neo.matrix = [];
_neo.matrix.push({
  id: '2824-previous-page-data',
  name: 'CiC Previous Page Data ThirdParty',
  active: 1,
  persist: 0,
  privacy: 2,
  qual: {},
  variants: {
    a: {
      lanes: [0, 99],
      dm: function dm() {
        window.ppdSnapShot = _neo.jackin.getCookie('ppd') ? _neo.jackin.getCookie('ppd') : 'entry|entry';
        _neo.jackin.waitForObjectPresent(window, 's').then(function () {
          setTimeout(function () {
            var pn = s.pageName ? s.pageName : 'not_set';
            var pt = s.prop17 ? s.prop17 : 'not_set';

            _neo.jackin.setCookie('ppd', pt + '|' + pn, 'session', '/', '.nike.com');
            _neo.nebu('2824-previous-page-data, ppd cookie established');
          }, 0);
        });
      }
    }
  }
});
/*
 * DAT-1439
 */
_neo.matrix.push({
    id: 'doubleclick-button',
    name: 'Doubleclick Register Button Click',
    active: 1,
    persist: 0,
    privacy: 2,
    qual: {
        page: 'id\=',
        listener: {
            type: "dom",
            name: "load"
        }
    },
    variants: {
        a: {
            lanes: [0, 99],
            dm: function dm(program, construct) {

                if (document.getElementsByClassName('arctic-green').length > 0) {
                    var series_id = window.location.search.split('id=')[1].split('&')[0] || "";
                    var img_src = "https://4171764.fls.doubleclick.net/activityi" +
                    // nike global brand account
                    ";src=4171764" +
                    //type
                    ";type=regconfm" +
                    //category
                    ";cat=regconfm" +
                    //country
                    ";u1=" + construct.country +
                    //language
                    ";u2=" + construct.language +
                    //page type
                    ";u3=" +
                    //page id
                    ";u4=" + ';u5=' + '' +
                    //items PIDS
                    ';u6=' + '' +
                    //Product Name
                    ";u7=" + series_id + ';u10=' + '' +
                    //Category
                    ';u11=' + '' +
                    //Quantity
                    ';u12=' + '' +
                    //Price
                    ';u13=' + '' +
                    //Currency
                    ';u14=' + (s.currencyCode || '') +
                    //Product Sizes
                    ';u15=' + '' +
                    //href
                    ';u17=' + encodeURIComponent(window.location.hostname) + ';dc_lat=;dc_rdid=;tag_for_child_directed_treatment=;' +
                    //order id
                    "ord=" + Date.now() + "?";
                    document.getElementsByClassName('arctic-green')[3].addEventListener('click', function () {
                        _neo.din(img_src, 'iframe', 'body');
                    });
                }
                return true;
            }
        }
    }
});
/*
 * DAT-1439
 */
_neo.matrix.push({
    id: 'doubleclick',
    name: 'Doubleclick Sydney And Register',
    active: 1,
    persist: 0,
    // privacy key:
    // 0 100% patches
    // 1 experiments
    // 2 tags
    privacy: 2,
    qual: {
        page: "events\-registration\/series|register\=true|\/cdp\/wsg\/(subscription|membership)",
        listener: {
            type: "dom",
            name: "load"
        }
    },
    param_map: [{
        "page": "events\-registration\/series",
        "cat": "ctyseris",
        "u3": "cdp",
        "u4": "running"
    }, {
        "page": "register\=true",
        "cat": "signup",
        "u3": "cdp",
        "u4": "running"
    }, {
        "page": "confirm\-subscription",
        "cat": "subconpg",
        "u3": "signup",
        "u4": "wsgsub"
    }, {
        "page": "confirm\-membership",
        "cat": "memconpg",
        "u3": "signup",
        "u4": "wsgmem"
    }, {
        "page": "subscription",
        "cat": "subpg",
        "u3": "signup",
        "u4": "wsgsub"
    }, {
        "page": "membership",
        "cat": "memregpg",
        "u3": "signup",
        "u4": "wsgmem"
    }],
    variants: {
        a: {
            lanes: [0, 99],
            dm: function dm(program, construct) {
                var paramMap = function paramMap() {
                    var params = {};
                    program.param_map.forEach(function (param_mapping) {
                        if (construct.pageURL.match(param_mapping.page)) {
                            for (var param in param_mapping) {
                                params[param] = param_mapping[param];
                            }
                        }
                    });
                    return params;
                };
                var series_id = "";
                if (window.location.search) {
                    series_id = window.location.search.split('id=')[1].split('&')[0] || "";
                }
                var img_src = "https://4171764.fls.doubleclick.net/activityi" +
                // nike global brand account
                ";src=4171764" +
                //type
                ";type=regconfm" +
                //category
                ";cat=" + paramMap().cat +
                //country
                ";u1=" + construct.country +
                //language
                ";u2=" + construct.language +
                //page type
                ";u3=" + paramMap().u3 +
                //page id
                ";u4=" + paramMap().u4 +
                //order quantity
                ';u5=' + '' +
                //items PIDS
                ';u6=' + '' +
                //Product Name
                ";u7=" + series_id + ';u10=' + '' +
                //Category
                ';u11=' + '' +
                //Quantity
                ';u12=' + '' +
                //Price
                ';u13=' + '' +
                //Currency
                ';u14=' + (s.currencyCode || '') +
                //Product Sizes
                ';u15=' + '' +
                //href
                ';u17=' + encodeURIComponent(window.location.hostname) + ';dc_lat=;dc_rdid=;tag_for_child_directed_treatment=;' +
                //order id
                ";ord=" + Math.round(Math.random() * 100000000) + "?";
                if (paramMap().cat) {
                    _neo.din(img_src, 'iframe', 'body');
                }
                return true;
            }
        }
    }
});
try {

  var platform_id = "nike.com",
      version = 'thirdparty',
      filename = 'dc.js';
  if (/thedraw\.nike\.com/.test(window.location.hostname)) {
    (function (platform_id, version, filename) {

      var utils = {

        getCookie: function getCookie(name) {
          var nameEQ = name + '=';
          var ca = document.cookie.split(';');
          for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
              c = c.substring(1, c.length);
            }
            if (c.indexOf(nameEQ) === 0) {
              return c.substring(nameEQ.length, c.length);
            }
          }
          return null;
        },

        isTest: function isTest() {
          try {
            return (/ecn[0-9]+|test\-web\.nike\.com|sit[0-9]+/.test(window.location.hostname)
            );
          } catch (e) {
            return false;
          }
        }
      };

      var loadModule = {

        configure: function configure(config) {
          this.config = config;
          this.sampleCookieName = 'dreams_sample';
          this.testEnv = utils.isTest();

          var rootDomain = this.testEnv ? '//test-web.nike.com' : '//web.nike.com';

          this.urlMap = {
            canary: rootDomain + '/dreams/dreamcatcher/canary/' + config.filename,
            candidate: rootDomain + '/dreams/dreamcatcher/candidate/' + config.filename,
            release: rootDomain + '/dreams/dreamcatcher/release/' + config.filename
          };

          return this;
        },

        init: function init() {
          this.sample = parseInt(utils.getCookie(this.sampleCookieName), 10);

          if (!this.sample) {
            this.sample = this.generateSample();
            this.recordSample(this.sample);
          }

          return this;
        },

        generateSample: function generateSample() {
          return Math.ceil(Math.random() * 100);
        },

        recordSample: function recordSample() {
          var expireDate = new Date();
          expireDate.setTime(expireDate.getTime() + 10 * 365 * 24 * 60 * 60 * 1000);
          var cookieDetails = [this.sampleCookieName + '=' + this.sample, 'expires=' + expireDate.toUTCString(), 'path=/', 'domain=.' + location.hostname.split('.').slice(-2).join('.')];

          document.cookie = cookieDetails.join('; ');
        },

        returnSampleSet: function returnSampleSet() {
          if (this.sample <= 10) {
            return 'canary';
          }

          if (this.sample <= 50) {
            return 'candidate';
          }

          return 'release';
        },

        request: function request() {
          var script = document.createElement('script');

          script.type = 'application/javascript';
          script.onload = this.startDC.bind(this);
          script.src = this.urlMap[this.returnSampleSet()];
          script.className = 'analytics-submodule';

          if (document.body) {
            document.body.appendChild(script);
          } else {
            window.addEventListener('DOMContentLoaded', function () {
              document.body.appendChild(script);
            });
          }
        },

        startDC: function startDC() {
          var dreamcatcherReference = window.dreams ? window.dreams.dreamcatcher : window.dreamcatcher;
          if (dreamcatcherReference && typeof dreamcatcherReference.init === 'function') {
            var initConfig = {
              platform: {
                id: this.config.platform.id,
                v: this.config.platform.version
              }
            };
            if (this.testEnv) {
              initConfig.endpoint = 'https://nod.test.nikecloud.com/rest/intake';
            }
            dreamcatcherReference.init(initConfig);
          }
        }
      };

      // ENVCONFIG is populated via build process
      loadModule.configure({
        "platform": {
          "id": platform_id,
          "version": version
        },
        "filename": filename
      }).init().request();
    })(platform_id, version, filename);
  }
} catch (e) {
  _neo.nebu('dreamcatcher', e);
}
try {
  if (!_neo.jackin.getCookie('guidS') && _neo.jackin.rootDomain()) {
    _neo.jackin.setCookie('guidS', _neo.jackin.generateUUID(), 315569200, '/', _neo.jackin.rootDomain());
  }

  if (!_neo.jackin.getCookie('guidU') && _neo.jackin.rootDomain()) {
    _neo.jackin.setCookie('guidU', _neo.jackin.generateUUID(), 94670856, '/', _neo.jackin.rootDomain());
  }
} catch (e) {
  if (_neo.nebu) {
    _neo.nebu('guids', e);
  }
}
/*
 DAT-1829:
 1. nike.dat.utils.pathame_array now called as _neo.shared.data().pathname_array
 2. nike.dat.utils.getPageID() now called as _neo.shared.data().pageType()
 3. from main, utag_data.land_page_id now called as _neo.shared.data().pageId()
 4. now attached to _neo.shared.data() (previously on utag_data)
 a. page_facets
 b. facet_array
 */

_neo.shared = {
  data: function data() {
    var data = {};

    data.guidS = _neo.jackin.getCookie('guidS') || 0;
    data.guidU = _neo.jackin.getCookie('guidU') || 0;
    data.pagename = window.s.pageName || '';
    data.usabilla_ids = {
      custom: {
        guidS: data.guidS,
        guidU: data.guidU,
        pagename: data.pagename
      }
    };
    data.pathname_array = window.location.pathname.split('/');

    // building page facets array for main and mobile, empty array if not.
    if ((_neo.main || _neo.mobile) && /\/pw\//.test(window.location.pathname)) {
      data.facet_array = [];
      var trackingData = void 0;

      if (_neo.mobile && _neo.jackin.getFromObject(window, 'nike.Util.getObjectFromElementJSON')) {
        trackingData = nike.Util.getObjectFromElementJSON($('#exp-gridwall-wrapper').find('span.trackingData'));
      } else if (_neo.main && _neo.jackin.getFromObject(window, 'nike.Util.getObjectFromElementJSON')) {
        trackingData = nike.Util.getObjectFromElementJSON($('#body-liner').find('span.trackingData'));
      }
      var trackingDataResponse = trackingData ? trackingData.response : {};
      var allFacets = trackingDataResponse && trackingDataResponse.allFacets ? trackingDataResponse.allFacets : [];

      $(allFacets).each(function (k, v) {
        // push only unique facets, negates duplication
        if (data.facet_array.indexOf(v.facetValueName) === -1) {
          data.facet_array.push(v.facetValueName);
        }
        nike.debug('Nike.DAT.Utils.eventHandler: Facet array: ' + data.facet_array);
      });
      data.facet_array.sort(); // sorts the facet array alphabetically
      data.page_facets = data.facet_array.join(',').toLowerCase();
    } else {
      data.page_facets = [];
    }

    // runs each qual function in the page_lib object and returns the one that is true as pageType value
    data.pageType = function () {
      var key = void 0;
      var found = void 0;

      found = false;
      for (key in data.page_lib) {
        if (!found && data.page_lib[key].qual()) {
          found = true;

          return key;
        }
      }
    };

    data.pageId = function () {
      var key = void 0;
      var found = void 0;

      found = false;
      for (key in data.page_lib) {
        if (!found && data.page_lib[key].qual()) {
          found = true;

          return data.page_lib[key].id();
        }
      }
    };

    // currencyPage values, mapped to doubleclick pageId
    if (_neo.ocp && _neo.jackin.getFromObject(window, 'nike.ocp.analytics.data.currencyCode')) {
      data.currencyPage = nike.ocp.analytics.data.currencyCode.toLowerCase();
    } else {
      data.currencyPage = '';
    }

    // page_lib properties are pageType values, qual returns true when it is the pageType,
    // id values ported from existing Tealium
    data.page_lib = {
      pdp: {
        qual: function qual() {
          return (/\/pd\/|\/product\//.test(window.location.pathname)
          );
        },
        id: function id() {
          return 'pdp:' + (_neo.main ? _neo.main.data().product_id : _neo.mobile ? _neo.mobile.data().product_id : '');
        }
      },
      pagebuilder: {
        qual: function qual() {
          return (/\/pw\//.test(window.location.pathname) || /l\=shop/.test(window.location.search)
          );
        },
        id: function id() {
          return 'pw:' + data.page_facets;
        }
      },
      store_home: {
        qual: function qual() {
          return window.location.hostname === 'store.nike.com' && window.location.pathname.split('/').length === 4;
        },
        id: function id() {
          return 'store_home';
        }
      },
      slp: {
        qual: function qual() {
          return (/\/c\//.test(window.location.pathname) && typeof window.location.pathname.split('/')[5] === 'undefined'
          );
        },
        id: function id() {
          return data.pathname_array[4];
        }
      },
      cdp: {
        qual: function qual() {
          return (/\/c\//.test(window.location.pathname) && typeof window.location.pathname.split('/')[5] !== 'undefined'
          );
        },
        id: function id() {
          return data.pathname_array.slice(4, 6).join(',');
        }
      },
      www_home: {
        qual: function qual() {
          return (/www\.nike\.com|m\.nike\.com/.test(window.location.hostname) && window.location.pathname.split('/').length === 4
          );
        },
        id: function id() {
          return 'view_www_home';
        }
      },
      registration: {
        qual: function qual() {
          return window.location.pathname.split('/')[4] === 'register';
        },
        id: function id() {
          return data.pathname_array[4];
        }
      },
      sl: {
        qual: function qual() {
          return (/store-locator/.test(window.location.pathname)
          );
        },
        id: function id() {
          return 'store-locator';
        }
      },
      cart: {
        qual: function qual() {
          return window.location.pathname.split('/')[4] === 'cart.jsp';
        },
        id: function id() {
          return 'view_cart';
        }
      },
      checkout_login: {
        qual: function qual() {
          return data.pathname_array[4] === 'checkout_login.jsp';
        },
        id: function id() {
          return 'checkout_login';
        }
      },
      shipping: {
        qual: function qual() {
          return data.pathname_array[4] === 'shipping.jsp';
        },
        id: function id() {
          return data.currencyPage + ':shipping';
        }
      },
      billing: {
        qual: function qual() {
          return data.pathname_array[4] === 'billing.jsp';
        },
        id: function id() {
          return data.currencyPage + ':billing';
        }
      },
      review: {
        qual: function qual() {
          return data.pathname_array[4] === 'review.jsp';
        },
        id: function id() {
          return data.currencyPage + ':review';
        }
      },
      confirm: {
        qual: function qual() {
          return window.location.pathname.split('/')[4] === 'confirm.jsp';
        },
        id: function id() {
          return 'view_confirmation';
        }
      },
      globalstore_checkout_success: {
        qual: function qual() {
          return window.location.hostname === 'secure-global.nike.com' && window.esw && window.esw.PaymentAttempt && window.esw.PaymentAttempt.Result === 'Success';
        },
        id: function id() {
          return 'globalstore_checkout_success';
        }
      },
      checkout: {
        qual: function qual() {
          return window.location.hostname === 'secure-global.nike.com' && window.esw && typeof window.esw.PaymentAttempt === 'undefined';
        },
        id: function id() {
          return 'regclick';
        }
      },
      cities_page: {
        qual: function qual() {
          return window.location.pathname.split('/')[3] === 'e' && window.location.pathname.split('/')[4] === 'cities';
        },
        id: function id() {
          return data.pathname_array.slice(4, 6).join(',');
        }
      },
      www_unknown: {
        qual: function qual() {
          return true;
        },
        id: function id() {
          return 'unknown';
        }
      }
    };

    data.getMID = function () {
      var arr = void 0;

      document.cookie.split(';').forEach(function (i) {
        if (/AMCV_/.test(i)) {
          arr = i.split('=');

          return arr;
        }
      });

      return arr === undefined ? 'not set' : decodeURIComponent(arr[1]).split('|');
    };

    return data;
  }
};
/* istanbul ignore next */

try {
    /* jshint ignore:start */
    /*eslint-disable */

    /* Updated per DAT-2304 */

    /*
     Start ActivityMap Module

     The following module enables ActivityMap tracking in Adobe Analytics. ActivityMap
     allows you to view data overlays on your links and content to understand how
     users engage with your web site. If you do not intend to use ActivityMap, you
     can remove the following block of code from your AppMeasurement.js file.
     Additional documentation on how to configure ActivityMap is available at:
     https://marketing.adobe.com/resources/help/en_US/analytics/activitymap/getting-started-admins.html
    */
    function AppMeasurement_Module_ActivityMap(f){function g(a,d){var b,c,n;if(a&&d&&(b=e.c[d]||(e.c[d]=d.split(","))))for(n=0;n<b.length&&(c=b[n++]);)if(-1<a.indexOf(c))return null;p=1;return a}function q(a,d,b,c,e){var g,h;if(a.dataset&&(h=a.dataset[d]))g=h;else if(a.getAttribute)if(h=a.getAttribute("data-"+b))g=h;else if(h=a.getAttribute(b))g=h;if(!g&&f.useForcedLinkTracking&&e&&(g="",d=a.onclick?""+a.onclick:"")){b=d.indexOf(c);var l,k;if(0<=b){for(b+=10;b<d.length&&0<="= \t\r\n".indexOf(d.charAt(b));)b++;
    if(b<d.length){h=b;for(l=k=0;h<d.length&&(";"!=d.charAt(h)||l);)l?d.charAt(h)!=l||k?k="\\"==d.charAt(h)?!k:0:l=0:(l=d.charAt(h),'"'!=l&&"'"!=l&&(l=0)),h++;if(d=d.substring(b,h))a.e=new Function("s","var e;try{s.w."+c+"="+d+"}catch(e){}"),a.e(f)}}}return g||e&&f.w[c]}function r(a,d,b){var c;return(c=e[d](a,b))&&(p?(p=0,c):g(k(c),e[d+"Exclusions"]))}function s(a,d,b){var c;if(a&&!(1===(c=a.nodeType)&&(c=a.nodeName)&&(c=c.toUpperCase())&&t[c])&&(1===a.nodeType&&(c=a.nodeValue)&&(d[d.length]=c),b.a||
    b.t||b.s||!a.getAttribute||((c=a.getAttribute("alt"))?b.a=c:(c=a.getAttribute("title"))?b.t=c:"IMG"==(""+a.nodeName).toUpperCase()&&(c=a.getAttribute("src")||a.src)&&(b.s=c)),(c=a.childNodes)&&c.length))for(a=0;a<c.length;a++)s(c[a],d,b)}function k(a){if(null==a||void 0==a)return a;try{return a.replace(RegExp("^[\\s\\n\\f\\r\\t\t-\r \u00a0\u1680\u180e\u2000-\u200a\u2028\u2029\u205f\u3000\ufeff]+","mg"),"").replace(RegExp("[\\s\\n\\f\\r\\t\t-\r \u00a0\u1680\u180e\u2000-\u200a\u2028\u2029\u205f\u3000\ufeff]+$",
    "mg"),"").replace(RegExp("[\\s\\n\\f\\r\\t\t-\r \u00a0\u1680\u180e\u2000-\u200a\u2028\u2029\u205f\u3000\ufeff]{1,}","mg")," ").substring(0,254)}catch(d){}}var e=this;e.s=f;var m=window;m.s_c_in||(m.s_c_il=[],m.s_c_in=0);e._il=m.s_c_il;e._in=m.s_c_in;e._il[e._in]=e;m.s_c_in++;e._c="s_m";e.c={};var p=0,t={SCRIPT:1,STYLE:1,LINK:1,CANVAS:1};e.link=function(a,d){var b;if(d)b=g(k(d),e.linkExclusions);else if((b=a)&&!(b=q(a,"sObjectId","s-object-id","s_objectID",1))){var c,f;(f=g(k(a.innerText||a.textContent),e.linkExclusions))||(s(a,c=[],b={a:void 0,t:void 0,s:void 0}),(f=g(k(c.join(""))))||(f=g(k(b.a?b.a:b.t?b.t:b.s?b.s:void 0)))||!(c=(c=a.tagName)&&c.toUpperCase?c.toUpperCase():
    "")||("INPUT"==c||"SUBMIT"==c&&a.value?f=g(k(a.value)):"IMAGE"==c&&a.src&&(f=g(k(a.src)))));b=f}return b};e.region=function(a){for(var d,b=e.regionIDAttribute||"id";a&&(a=a.parentNode);){if(d=q(a,b,b,b))return d;if("BODY"==a.nodeName)return"BODY"}}}
    /* End ActivityMap Module */
    /*
     ============== DO NOT ALTER ANYTHING BELOW THIS LINE ! ===============

    AppMeasurement for JavaScript version: 1.7.0
    Copyright 1996-2016 Adobe, Inc. All Rights Reserved
    More info available at http://www.adobe.com/marketing-cloud.html
    */
    function AppMeasurement(){var a=this;a.version="1.7.0";var k=window;k.s_c_in||(k.s_c_il=[],k.s_c_in=0);a._il=k.s_c_il;a._in=k.s_c_in;a._il[a._in]=a;k.s_c_in++;a._c="s_c";var q=k.AppMeasurement.Jb;q||(q=null);var r=k,n,t;try{for(n=r.parent,t=r.location;n&&n.location&&t&&""+n.location!=""+t&&r.location&&""+n.location!=""+r.location&&n.location.host==t.host;)r=n,n=r.parent}catch(u){}a.yb=function(a){try{console.log(a)}catch(b){}};a.Ha=function(a){return""+parseInt(a)==""+a};a.replace=function(a,b,d){return!a||
    0>a.indexOf(b)?a:a.split(b).join(d)};a.escape=function(c){var b,d;if(!c)return c;c=encodeURIComponent(c);for(b=0;7>b;b++)d="+~!*()'".substring(b,b+1),0<=c.indexOf(d)&&(c=a.replace(c,d,"%"+d.charCodeAt(0).toString(16).toUpperCase()));return c};a.unescape=function(c){if(!c)return c;c=0<=c.indexOf("+")?a.replace(c,"+"," "):c;try{return decodeURIComponent(c)}catch(b){}return unescape(c)};a.pb=function(){var c=k.location.hostname,b=a.fpCookieDomainPeriods,d;b||(b=a.cookieDomainPeriods);if(c&&!a.cookieDomain&&
    !/^[0-9.]+$/.test(c)&&(b=b?parseInt(b):2,b=2<b?b:2,d=c.lastIndexOf("."),0<=d)){for(;0<=d&&1<b;)d=c.lastIndexOf(".",d-1),b--;a.cookieDomain=0<d?c.substring(d):c}return a.cookieDomain};a.c_r=a.cookieRead=function(c){c=a.escape(c);var b=" "+a.d.cookie,d=b.indexOf(" "+c+"="),f=0>d?d:b.indexOf(";",d);c=0>d?"":a.unescape(b.substring(d+2+c.length,0>f?b.length:f));return"[[B]]"!=c?c:""};a.c_w=a.cookieWrite=function(c,b,d){var f=a.pb(),e=a.cookieLifetime,g;b=""+b;e=e?(""+e).toUpperCase():"";d&&"SESSION"!=
    e&&"NONE"!=e&&((g=""!=b?parseInt(e?e:0):-60)?(d=new Date,d.setTime(d.getTime()+1E3*g)):1==d&&(d=new Date,g=d.getYear(),d.setYear(g+5+(1900>g?1900:0))));return c&&"NONE"!=e?(a.d.cookie=a.escape(c)+"="+a.escape(""!=b?b:"[[B]]")+"; path=/;"+(d&&"SESSION"!=e?" expires="+d.toGMTString()+";":"")+(f?" domain="+f+";":""),a.cookieRead(c)==b):0};a.K=[];a.ha=function(c,b,d){if(a.Aa)return 0;a.maxDelay||(a.maxDelay=250);var f=0,e=(new Date).getTime()+a.maxDelay,g=a.d.visibilityState,m=["webkitvisibilitychange",
    "visibilitychange"];g||(g=a.d.webkitVisibilityState);if(g&&"prerender"==g){if(!a.ia)for(a.ia=1,d=0;d<m.length;d++)a.d.addEventListener(m[d],function(){var b=a.d.visibilityState;b||(b=a.d.webkitVisibilityState);"visible"==b&&(a.ia=0,a.delayReady())});f=1;e=0}else d||a.p("_d")&&(f=1);f&&(a.K.push({m:c,a:b,t:e}),a.ia||setTimeout(a.delayReady,a.maxDelay));return f};a.delayReady=function(){var c=(new Date).getTime(),b=0,d;for(a.p("_d")?b=1:a.va();0<a.K.length;){d=a.K.shift();if(b&&!d.t&&d.t>c){a.K.unshift(d);
    setTimeout(a.delayReady,parseInt(a.maxDelay/2));break}a.Aa=1;a[d.m].apply(a,d.a);a.Aa=0}};a.setAccount=a.sa=function(c){var b,d;if(!a.ha("setAccount",arguments))if(a.account=c,a.allAccounts)for(b=a.allAccounts.concat(c.split(",")),a.allAccounts=[],b.sort(),d=0;d<b.length;d++)0!=d&&b[d-1]==b[d]||a.allAccounts.push(b[d]);else a.allAccounts=c.split(",")};a.foreachVar=function(c,b){var d,f,e,g,m="";e=f="";if(a.lightProfileID)d=a.O,(m=a.lightTrackVars)&&(m=","+m+","+a.ma.join(",")+",");else{d=a.g;if(a.pe||
    a.linkType)m=a.linkTrackVars,f=a.linkTrackEvents,a.pe&&(e=a.pe.substring(0,1).toUpperCase()+a.pe.substring(1),a[e]&&(m=a[e].Hb,f=a[e].Gb));m&&(m=","+m+","+a.G.join(",")+",");f&&m&&(m+=",events,")}b&&(b=","+b+",");for(f=0;f<d.length;f++)e=d[f],(g=a[e])&&(!m||0<=m.indexOf(","+e+","))&&(!b||0<=b.indexOf(","+e+","))&&c(e,g)};a.r=function(c,b,d,f,e){var g="",m,p,k,w,n=0;"contextData"==c&&(c="c");if(b){for(m in b)if(!(Object.prototype[m]||e&&m.substring(0,e.length)!=e)&&b[m]&&(!d||0<=d.indexOf(","+(f?f+
    ".":"")+m+","))){k=!1;if(n)for(p=0;p<n.length;p++)m.substring(0,n[p].length)==n[p]&&(k=!0);if(!k&&(""==g&&(g+="&"+c+"."),p=b[m],e&&(m=m.substring(e.length)),0<m.length))if(k=m.indexOf("."),0<k)p=m.substring(0,k),k=(e?e:"")+p+".",n||(n=[]),n.push(k),g+=a.r(p,b,d,f,k);else if("boolean"==typeof p&&(p=p?"true":"false"),p){if("retrieveLightData"==f&&0>e.indexOf(".contextData."))switch(k=m.substring(0,4),w=m.substring(4),m){case "transactionID":m="xact";break;case "channel":m="ch";break;case "campaign":m=
    "v0";break;default:a.Ha(w)&&("prop"==k?m="c"+w:"eVar"==k?m="v"+w:"list"==k?m="l"+w:"hier"==k&&(m="h"+w,p=p.substring(0,255)))}g+="&"+a.escape(m)+"="+a.escape(p)}}""!=g&&(g+="&."+c)}return g};a.usePostbacks=0;a.sb=function(){var c="",b,d,f,e,g,m,p,k,n="",r="",s=e="";if(a.lightProfileID)b=a.O,(n=a.lightTrackVars)&&(n=","+n+","+a.ma.join(",")+",");else{b=a.g;if(a.pe||a.linkType)n=a.linkTrackVars,r=a.linkTrackEvents,a.pe&&(e=a.pe.substring(0,1).toUpperCase()+a.pe.substring(1),a[e]&&(n=a[e].Hb,r=a[e].Gb));
    n&&(n=","+n+","+a.G.join(",")+",");r&&(r=","+r+",",n&&(n+=",events,"));a.events2&&(s+=(""!=s?",":"")+a.events2)}if(a.visitor&&1.5<=parseFloat(a.visitor.version)&&a.visitor.getCustomerIDs){e=q;if(g=a.visitor.getCustomerIDs())for(d in g)Object.prototype[d]||(f=g[d],e||(e={}),f.id&&(e[d+".id"]=f.id),f.authState&&(e[d+".as"]=f.authState));e&&(c+=a.r("cid",e))}a.AudienceManagement&&a.AudienceManagement.isReady()&&(c+=a.r("d",a.AudienceManagement.getEventCallConfigParams()));for(d=0;d<b.length;d++){e=b[d];
    g=a[e];f=e.substring(0,4);m=e.substring(4);!g&&"events"==e&&s&&(g=s,s="");if(g&&(!n||0<=n.indexOf(","+e+","))){switch(e){case "supplementalDataID":e="sdid";break;case "timestamp":e="ts";break;case "dynamicVariablePrefix":e="D";break;case "visitorID":e="vid";break;case "marketingCloudVisitorID":e="mid";break;case "analyticsVisitorID":e="aid";break;case "audienceManagerLocationHint":e="aamlh";break;case "audienceManagerBlob":e="aamb";break;case "authState":e="as";break;case "pageURL":e="g";255<g.length&&
    (a.pageURLRest=g.substring(255),g=g.substring(0,255));break;case "pageURLRest":e="-g";break;case "referrer":e="r";break;case "vmk":case "visitorMigrationKey":e="vmt";break;case "visitorMigrationServer":e="vmf";a.ssl&&a.visitorMigrationServerSecure&&(g="");break;case "visitorMigrationServerSecure":e="vmf";!a.ssl&&a.visitorMigrationServer&&(g="");break;case "charSet":e="ce";break;case "visitorNamespace":e="ns";break;case "cookieDomainPeriods":e="cdp";break;case "cookieLifetime":e="cl";break;case "variableProvider":e=
    "vvp";break;case "currencyCode":e="cc";break;case "channel":e="ch";break;case "transactionID":e="xact";break;case "campaign":e="v0";break;case "latitude":e="lat";break;case "longitude":e="lon";break;case "resolution":e="s";break;case "colorDepth":e="c";break;case "javascriptVersion":e="j";break;case "javaEnabled":e="v";break;case "cookiesEnabled":e="k";break;case "browserWidth":e="bw";break;case "browserHeight":e="bh";break;case "connectionType":e="ct";break;case "homepage":e="hp";break;case "events":s&&
    (g+=(""!=g?",":"")+s);if(r)for(m=g.split(","),g="",f=0;f<m.length;f++)p=m[f],k=p.indexOf("="),0<=k&&(p=p.substring(0,k)),k=p.indexOf(":"),0<=k&&(p=p.substring(0,k)),0<=r.indexOf(","+p+",")&&(g+=(g?",":"")+m[f]);break;case "events2":g="";break;case "contextData":c+=a.r("c",a[e],n,e);g="";break;case "lightProfileID":e="mtp";break;case "lightStoreForSeconds":e="mtss";a.lightProfileID||(g="");break;case "lightIncrementBy":e="mti";a.lightProfileID||(g="");break;case "retrieveLightProfiles":e="mtsr";break;
    case "deleteLightProfiles":e="mtsd";break;case "retrieveLightData":a.retrieveLightProfiles&&(c+=a.r("mts",a[e],n,e));g="";break;default:a.Ha(m)&&("prop"==f?e="c"+m:"eVar"==f?e="v"+m:"list"==f?e="l"+m:"hier"==f&&(e="h"+m,g=g.substring(0,255)))}g&&(c+="&"+e+"="+("pev"!=e.substring(0,3)?a.escape(g):g))}"pev3"==e&&a.e&&(c+=a.e)}return c};a.D=function(a){var b=a.tagName;if("undefined"!=""+a.Mb||"undefined"!=""+a.Cb&&"HTML"!=(""+a.Cb).toUpperCase())return"";b=b&&b.toUpperCase?b.toUpperCase():"";"SHAPE"==
    b&&(b="");b&&(("INPUT"==b||"BUTTON"==b)&&a.type&&a.type.toUpperCase?b=a.type.toUpperCase():!b&&a.href&&(b="A"));return b};a.Da=function(a){var b=a.href?a.href:"",d,f,e;d=b.indexOf(":");f=b.indexOf("?");e=b.indexOf("/");b&&(0>d||0<=f&&d>f||0<=e&&d>e)&&(f=a.protocol&&1<a.protocol.length?a.protocol:l.protocol?l.protocol:"",d=l.pathname.lastIndexOf("/"),b=(f?f+"//":"")+(a.host?a.host:l.host?l.host:"")+("/"!=h.substring(0,1)?l.pathname.substring(0,0>d?0:d)+"/":"")+b);return b};a.L=function(c){var b=a.D(c),
    d,f,e="",g=0;return b&&(d=c.protocol,f=c.onclick,!c.href||"A"!=b&&"AREA"!=b||f&&d&&!(0>d.toLowerCase().indexOf("javascript"))?f?(e=a.replace(a.replace(a.replace(a.replace(""+f,"\r",""),"\n",""),"\t","")," ",""),g=2):"INPUT"==b||"SUBMIT"==b?(c.value?e=c.value:c.innerText?e=c.innerText:c.textContent&&(e=c.textContent),g=3):"IMAGE"==b&&c.src&&(e=c.src):e=a.Da(c),e)?{id:e.substring(0,100),type:g}:0};a.Kb=function(c){for(var b=a.D(c),d=a.L(c);c&&!d&&"BODY"!=b;)if(c=c.parentElement?c.parentElement:c.parentNode)b=
    a.D(c),d=a.L(c);d&&"BODY"!=b||(c=0);c&&(b=c.onclick?""+c.onclick:"",0<=b.indexOf(".tl(")||0<=b.indexOf(".trackLink("))&&(c=0);return c};a.Bb=function(){var c,b,d=a.linkObject,f=a.linkType,e=a.linkURL,g,m;a.na=1;d||(a.na=0,d=a.clickObject);if(d){c=a.D(d);for(b=a.L(d);d&&!b&&"BODY"!=c;)if(d=d.parentElement?d.parentElement:d.parentNode)c=a.D(d),b=a.L(d);b&&"BODY"!=c||(d=0);if(d&&!a.linkObject){var p=d.onclick?""+d.onclick:"";if(0<=p.indexOf(".tl(")||0<=p.indexOf(".trackLink("))d=0}}else a.na=1;!e&&d&&
    (e=a.Da(d));e&&!a.linkLeaveQueryString&&(g=e.indexOf("?"),0<=g&&(e=e.substring(0,g)));if(!f&&e){var n=0,r=0,q;if(a.trackDownloadLinks&&a.linkDownloadFileTypes)for(p=e.toLowerCase(),g=p.indexOf("?"),m=p.indexOf("#"),0<=g?0<=m&&m<g&&(g=m):g=m,0<=g&&(p=p.substring(0,g)),g=a.linkDownloadFileTypes.toLowerCase().split(","),m=0;m<g.length;m++)(q=g[m])&&p.substring(p.length-(q.length+1))=="."+q&&(f="d");if(a.trackExternalLinks&&!f&&(p=e.toLowerCase(),a.Ga(p)&&(a.linkInternalFilters||(a.linkInternalFilters=
    k.location.hostname),g=0,a.linkExternalFilters?(g=a.linkExternalFilters.toLowerCase().split(","),n=1):a.linkInternalFilters&&(g=a.linkInternalFilters.toLowerCase().split(",")),g))){for(m=0;m<g.length;m++)q=g[m],0<=p.indexOf(q)&&(r=1);r?n&&(f="e"):n||(f="e")}}a.linkObject=d;a.linkURL=e;a.linkType=f;if(a.trackClickMap||a.trackInlineStats)a.e="",d&&(f=a.pageName,e=1,d=d.sourceIndex,f||(f=a.pageURL,e=0),k.s_objectID&&(b.id=k.s_objectID,d=b.type=1),f&&b&&b.id&&c&&(a.e="&pid="+a.escape(f.substring(0,255))+
    (e?"&pidt="+e:"")+"&oid="+a.escape(b.id.substring(0,100))+(b.type?"&oidt="+b.type:"")+"&ot="+c+(d?"&oi="+d:"")))};a.tb=function(){var c=a.na,b=a.linkType,d=a.linkURL,f=a.linkName;b&&(d||f)&&(b=b.toLowerCase(),"d"!=b&&"e"!=b&&(b="o"),a.pe="lnk_"+b,a.pev1=d?a.escape(d):"",a.pev2=f?a.escape(f):"",c=1);a.abort&&(c=0);if(a.trackClickMap||a.trackInlineStats||a.ActivityMap){var b={},d=0,e=a.cookieRead("s_sq"),g=e?e.split("&"):0,m,p,k,e=0;if(g)for(m=0;m<g.length;m++)p=g[m].split("="),f=a.unescape(p[0]).split(","),
    p=a.unescape(p[1]),b[p]=f;f=a.account.split(",");m={};for(k in a.contextData)k&&!Object.prototype[k]&&(m[k]=a.contextData[k],a.contextData[k]="");a.e=a.r("c",m)+(a.e?a.e:"");if(c||a.e){c&&!a.e&&(e=1);for(p in b)if(!Object.prototype[p])for(k=0;k<f.length;k++)for(e&&(g=b[p].join(","),g==a.account&&(a.e+=("&"!=p.charAt(0)?"&":"")+p,b[p]=[],d=1)),m=0;m<b[p].length;m++)g=b[p][m],g==f[k]&&(e&&(a.e+="&u="+a.escape(g)+("&"!=p.charAt(0)?"&":"")+p+"&u=0"),b[p].splice(m,
    1),d=1);c||(d=1);if(d){e="";m=2;!c&&a.e&&(e=a.escape(f.join(","))+"="+a.escape(a.e),m=1);for(p in b)!Object.prototype[p]&&0<m&&0<b[p].length&&(e+=(e?"&":"")+a.escape(b[p].join(","))+"="+a.escape(p),m--);a.cookieWrite("s_sq",e)}}}return c};a.ub=function(){if(!a.Fb){var c=new Date,b=r.location,d,f,e=f=d="",g="",m="",k="1.2",n=a.cookieWrite("s_cc","true",0)?"Y":"N",q="",s="";if(c.setUTCDate&&(k="1.3",(0).toPrecision&&(k="1.5",c=[],c.forEach))){k="1.6";f=0;d={};try{f=new Iterator(d),f.next&&(k="1.7",
    c.reduce&&(k="1.8",k.trim&&(k="1.8.1",Date.parse&&(k="1.8.2",Object.create&&(k="1.8.5")))))}catch(t){}}d=screen.width+"x"+screen.height;e=navigator.javaEnabled()?"Y":"N";f=screen.pixelDepth?screen.pixelDepth:screen.colorDepth;g=a.w.innerWidth?a.w.innerWidth:a.d.documentElement.offsetWidth;m=a.w.innerHeight?a.w.innerHeight:a.d.documentElement.offsetHeight;try{a.b.addBehavior("#default#homePage"),q=a.b.Lb(b)?"Y":"N"}catch(u){}try{a.b.addBehavior("#default#clientCaps"),s=a.b.connectionType}catch(x){}a.resolution=
    d;a.colorDepth=f;a.javascriptVersion=k;a.javaEnabled=e;a.cookiesEnabled=n;a.browserWidth=g;a.browserHeight=m;a.connectionType=s;a.homepage=q;a.Fb=1}};a.P={};a.loadModule=function(c,b){var d=a.P[c];if(!d){d=k["AppMeasurement_Module_"+c]?new k["AppMeasurement_Module_"+c](a):{};a.P[c]=a[c]=d;d.Xa=function(){return d.ab};d.bb=function(b){if(d.ab=b)a[c+"_onLoad"]=b,a.ha(c+"_onLoad",[a,d],1)||b(a,d)};try{Object.defineProperty?Object.defineProperty(d,"onLoad",{get:d.Xa,set:d.bb}):d._olc=1}catch(f){d._olc=
    1}}b&&(a[c+"_onLoad"]=b,a.ha(c+"_onLoad",[a,d],1)||b(a,d))};a.p=function(c){var b,d;for(b in a.P)if(!Object.prototype[b]&&(d=a.P[b])&&(d._olc&&d.onLoad&&(d._olc=0,d.onLoad(a,d)),d[c]&&d[c]()))return 1;return 0};a.wb=function(){var c=Math.floor(1E13*Math.random()),b=a.visitorSampling,d=a.visitorSamplingGroup,d="s_vsn_"+(a.visitorNamespace?a.visitorNamespace:a.account)+(d?"_"+d:""),f=a.cookieRead(d);if(b){f&&(f=parseInt(f));if(!f){if(!a.cookieWrite(d,c))return 0;f=c}if(f%1E4>v)return 0}return 1};a.Q=
    function(c,b){var d,f,e,g,m,k;for(d=0;2>d;d++)for(f=0<d?a.wa:a.g,e=0;e<f.length;e++)if(g=f[e],(m=c[g])||c["!"+g]){if(!b&&("contextData"==g||"retrieveLightData"==g)&&a[g])for(k in a[g])m[k]||(m[k]=a[g][k]);a[g]=m}};a.Qa=function(c,b){var d,f,e,g;for(d=0;2>d;d++)for(f=0<d?a.wa:a.g,e=0;e<f.length;e++)g=f[e],c[g]=a[g],b||c[g]||(c["!"+g]=1)};a.ob=function(a){var b,d,f,e,g,k=0,p,n="",q="";if(a&&255<a.length&&(b=""+a,d=b.indexOf("?"),0<d&&(p=b.substring(d+1),b=b.substring(0,d),e=b.toLowerCase(),f=0,"http://"==
    e.substring(0,7)?f+=7:"https://"==e.substring(0,8)&&(f+=8),d=e.indexOf("/",f),0<d&&(e=e.substring(f,d),g=b.substring(d),b=b.substring(0,d),0<=e.indexOf("google")?k=",q,ie,start,search_key,word,kw,cd,":0<=e.indexOf("yahoo.co")&&(k=",p,ei,"),k&&p)))){if((a=p.split("&"))&&1<a.length){for(f=0;f<a.length;f++)e=a[f],d=e.indexOf("="),0<d&&0<=k.indexOf(","+e.substring(0,d)+",")?n+=(n?"&":"")+e:q+=(q?"&":"")+e;n&&q?p=n+"&"+q:q=""}d=253-(p.length-q.length)-b.length;a=b+(0<d?g.substring(0,d):"")+"?"+p}return a};
    a.Wa=function(c){var b=a.d.visibilityState,d=["webkitvisibilitychange","visibilitychange"];b||(b=a.d.webkitVisibilityState);if(b&&"prerender"==b){if(c)for(b=0;b<d.length;b++)a.d.addEventListener(d[b],function(){var b=a.d.visibilityState;b||(b=a.d.webkitVisibilityState);"visible"==b&&c()});return!1}return!0};a.da=!1;a.I=!1;a.eb=function(){a.I=!0;a.j()};a.ba=!1;a.U=!1;a.$a=function(c){a.marketingCloudVisitorID=c;a.U=!0;a.j()};a.ea=!1;a.V=!1;a.fb=function(c){a.visitorOptedOut=c;a.V=!0;a.j()};a.Y=!1;
    a.R=!1;a.Sa=function(c){a.analyticsVisitorID=c;a.R=!0;a.j()};a.aa=!1;a.T=!1;a.Ua=function(c){a.audienceManagerLocationHint=c;a.T=!0;a.j()};a.Z=!1;a.S=!1;a.Ta=function(c){a.audienceManagerBlob=c;a.S=!0;a.j()};a.Va=function(c){a.maxDelay||(a.maxDelay=250);return a.p("_d")?(c&&setTimeout(function(){c()},a.maxDelay),!1):!0};a.ca=!1;a.H=!1;a.va=function(){a.H=!0;a.j()};a.isReadyToTrack=function(){var c=!0,b=a.visitor,d,f,e;a.da||a.I||(a.Wa(a.eb)?a.I=!0:a.da=!0);if(a.da&&!a.I)return!1;b&&b.isAllowed()&&
    (a.ba||a.marketingCloudVisitorID||!b.getMarketingCloudVisitorID||(a.ba=!0,a.marketingCloudVisitorID=b.getMarketingCloudVisitorID([a,a.$a]),a.marketingCloudVisitorID&&(a.U=!0)),a.ea||a.visitorOptedOut||!b.isOptedOut||(a.ea=!0,a.visitorOptedOut=b.isOptedOut([a,a.fb]),a.visitorOptedOut!=q&&(a.V=!0)),a.Y||a.analyticsVisitorID||!b.getAnalyticsVisitorID||(a.Y=!0,a.analyticsVisitorID=b.getAnalyticsVisitorID([a,a.Sa]),a.analyticsVisitorID&&(a.R=!0)),a.aa||a.audienceManagerLocationHint||!b.getAudienceManagerLocationHint||
    (a.aa=!0,a.audienceManagerLocationHint=b.getAudienceManagerLocationHint([a,a.Ua]),a.audienceManagerLocationHint&&(a.T=!0)),a.Z||a.audienceManagerBlob||!b.getAudienceManagerBlob||(a.Z=!0,a.audienceManagerBlob=b.getAudienceManagerBlob([a,a.Ta]),a.audienceManagerBlob&&(a.S=!0)),c=a.ba&&!a.U&&!a.marketingCloudVisitorID,b=a.Y&&!a.R&&!a.analyticsVisitorID,d=a.aa&&!a.T&&!a.audienceManagerLocationHint,f=a.Z&&!a.S&&!a.audienceManagerBlob,e=a.ea&&!a.V,c=c||b||d||f||e?!1:!0);a.ca||a.H||(a.Va(a.va)?a.H=!0:a.ca=
    !0);a.ca&&!a.H&&(c=!1);return c};a.o=q;a.u=0;a.callbackWhenReadyToTrack=function(c,b,d){var f;f={};f.jb=c;f.ib=b;f.gb=d;a.o==q&&(a.o=[]);a.o.push(f);0==a.u&&(a.u=setInterval(a.j,100))};a.j=function(){var c;if(a.isReadyToTrack()&&(a.cb(),a.o!=q))for(;0<a.o.length;)c=a.o.shift(),c.ib.apply(c.jb,c.gb)};a.cb=function(){a.u&&(clearInterval(a.u),a.u=0)};a.Ya=function(c){var b,d,f=q,e=q;if(!a.isReadyToTrack()){b=[];if(c!=q)for(d in f={},c)f[d]=c[d];e={};a.Qa(e,!0);b.push(f);b.push(e);a.callbackWhenReadyToTrack(a,
    a.track,b);return!0}return!1};a.qb=function(){var c=a.cookieRead("s_fid"),b="",d="",f;f=8;var e=4;if(!c||0>c.indexOf("-")){for(c=0;16>c;c++)f=Math.floor(Math.random()*f),b+="0123456789ABCDEF".substring(f,f+1),f=Math.floor(Math.random()*e),d+="0123456789ABCDEF".substring(f,f+1),f=e=16;c=b+"-"+d}a.cookieWrite("s_fid",c,1)||(c=0);return c};a.t=a.track=function(c,b){var d,f=new Date,e="s"+Math.floor(f.getTime()/108E5)%10+Math.floor(1E13*Math.random()),g=f.getYear(),g="t="+a.escape(f.getDate()+"/"+f.getMonth()+
    "/"+(1900>g?g+1900:g)+" "+f.getHours()+":"+f.getMinutes()+":"+f.getSeconds()+" "+f.getDay()+" "+f.getTimezoneOffset());a.visitor&&(a.visitor.getAuthState&&(a.authState=a.visitor.getAuthState()),!a.supplementalDataID&&a.visitor.getSupplementalDataID&&(a.supplementalDataID=a.visitor.getSupplementalDataID("AppMeasurement:"+a._in,a.expectSupplementalData?!1:!0)));a.p("_s");a.Ya(c)||(b&&a.Q(b),c&&(d={},a.Qa(d,0),a.Q(c)),a.wb()&&!a.visitorOptedOut&&(a.analyticsVisitorID||a.marketingCloudVisitorID||(a.fid=
    a.qb()),a.Bb(),a.usePlugins&&a.doPlugins&&a.doPlugins(a),a.account&&(a.abort||(a.trackOffline&&!a.timestamp&&(a.timestamp=Math.floor(f.getTime()/1E3)),f=k.location,a.pageURL||(a.pageURL=f.href?f.href:f),a.referrer||a.Ra||(a.referrer=r.document.referrer),a.Ra=1,a.referrer=a.ob(a.referrer),a.p("_g")),a.tb()&&!a.abort&&(a.ub(),g+=a.sb(),a.Ab(e,g),a.p("_t"),a.referrer=""))),c&&a.Q(d,1));a.abort=a.supplementalDataID=a.timestamp=a.pageURLRest=a.linkObject=a.clickObject=a.linkURL=a.linkName=a.linkType=k.s_objectID=
    a.pe=a.pev1=a.pev2=a.pev3=a.e=a.lightProfileID=0};a.tl=a.trackLink=function(c,b,d,f,e){a.linkObject=c;a.linkType=b;a.linkName=d;e&&(a.l=c,a.A=e);return a.track(f)};a.trackLight=function(c,b,d,f){a.lightProfileID=c;a.lightStoreForSeconds=b;a.lightIncrementBy=d;return a.track(f)};a.clearVars=function(){var c,b;for(c=0;c<a.g.length;c++)if(b=a.g[c],"prop"==b.substring(0,4)||"eVar"==b.substring(0,4)||"hier"==b.substring(0,4)||"list"==b.substring(0,4)||"channel"==b||"events"==b||"eventList"==b||"products"==
    b||"productList"==b||"purchaseID"==b||"transactionID"==b||"state"==b||"zip"==b||"campaign"==b)a[b]=void 0};a.tagContainerMarker="";a.Ab=function(c,b){var d,f=a.trackingServer;d="";var e=a.dc,g="sc.",k=a.visitorNamespace;f?a.trackingServerSecure&&a.ssl&&(f=a.trackingServerSecure):(k||(k=a.account,f=k.indexOf(","),0<=f&&(k=k.substring(0,f)),k=k.replace(/[^A-Za-z0-9]/g,"")),d||(d="2o7.net"),e=e?(""+e).toLowerCase():"d1","2o7.net"==d&&("d1"==e?e="112":"d2"==e&&(e="122"),g=""),f=k+"."+e+"."+g+d);d=a.ssl?
    "https://":"http://";e=a.AudienceManagement&&a.AudienceManagement.isReady()||0!=a.usePostbacks;d+=f+"/b/ss/"+a.account+"/"+(a.mobile?"5.":"")+(e?"10":"1")+"/JS-"+a.version+(a.Eb?"T":"")+(a.tagContainerMarker?"-"+a.tagContainerMarker:"")+"/"+c+"?AQB=1&ndh=1&pf=1&"+(e?"callback=s_c_il["+a._in+"].doPostbacks&et=1&":"")+b+"&AQE=1";a.mb(d);a.ja()};a.Pa=/{(%?)(.*?)(%?)}/;a.Ib=RegExp(a.Pa.source,"g");a.nb=function(c){if("object"==typeof c.dests)for(var b=0;b<c.dests.length;++b)if(o=c.dests[b],"string"==
    typeof o.c&&"aa."==o.id.substr(0,3))for(var d=o.c.match(a.Ib),b=0;b<d.length;++b){match=d[b];var f=match.match(a.Pa),e="";"%"==f[1]&&"timezone_offset"==f[2]?e=(new Date).getTimezoneOffset():"%"==f[1]&&"timestampz"==f[2]&&(e=a.rb());o.c=o.c.replace(match,a.escape(e))}};a.rb=function(){var c=new Date,b=new Date(6E4*Math.abs(c.getTimezoneOffset()));return a.k(4,c.getFullYear())+"-"+a.k(2,c.getMonth()+1)+"-"+a.k(2,c.getDate())+"T"+a.k(2,c.getHours())+":"+a.k(2,c.getMinutes())+":"+a.k(2,c.getSeconds())+
    (0<c.getTimezoneOffset()?"-":"+")+a.k(2,b.getUTCHours())+":"+a.k(2,b.getUTCMinutes())};a.k=function(a,b){return(Array(a+1).join(0)+b).slice(-a)};a.ra={};a.doPostbacks=function(c){if("object"==typeof c)if(a.nb(c),"object"==typeof a.AudienceManagement&&"function"==typeof a.AudienceManagement.isReady&&a.AudienceManagement.isReady()&&"function"==typeof a.AudienceManagement.passData)a.AudienceManagement.passData(c);else if("object"==typeof c&&"object"==typeof c.dests)for(var b=0;b<c.dests.length;++b)dest=
    c.dests[b],"object"==typeof dest&&"string"==typeof dest.c&&"string"==typeof dest.id&&"aa."==dest.id.substr(0,3)&&(a.ra[dest.id]=new Image,a.ra[dest.id].alt="",a.ra[dest.id].src=dest.c)};a.mb=function(c){a.i||a.vb();a.i.push(c);a.la=a.C();a.Na()};a.vb=function(){a.i=a.xb();a.i||(a.i=[])};a.xb=function(){var c,b;if(a.qa()){try{(b=k.localStorage.getItem(a.oa()))&&(c=k.JSON.parse(b))}catch(d){}return c}};a.qa=function(){var c=!0;a.trackOffline&&a.offlineFilename&&k.localStorage&&k.JSON||(c=!1);return c};
    a.Ea=function(){var c=0;a.i&&(c=a.i.length);a.q&&c++;return c};a.ja=function(){if(a.q&&(a.B&&a.B.complete&&a.B.F&&a.B.ua(),a.q))return;a.Fa=q;if(a.pa)a.la>a.N&&a.La(a.i),a.ta(500);else{var c=a.hb();if(0<c)a.ta(c);else if(c=a.Ba())a.q=1,a.zb(c),a.Db(c)}};a.ta=function(c){a.Fa||(c||(c=0),a.Fa=setTimeout(a.ja,c))};a.hb=function(){var c;if(!a.trackOffline||0>=a.offlineThrottleDelay)return 0;c=a.C()-a.Ka;return a.offlineThrottleDelay<c?0:a.offlineThrottleDelay-c};a.Ba=function(){if(0<a.i.length)return a.i.shift()};
    a.zb=function(c){if(a.debugTracking){var b="AppMeasurement Debug: "+c;c=c.split("&");var d;for(d=0;d<c.length;d++)b+="\n\t"+a.unescape(c[d]);a.yb(b)}};a.Za=function(){return a.marketingCloudVisitorID||a.analyticsVisitorID};a.X=!1;var s;try{s=JSON.parse('{"x":"y"}')}catch(x){s=null}s&&"y"==s.x?(a.X=!0,a.W=function(a){return JSON.parse(a)}):k.$&&k.$.parseJSON?(a.W=function(a){return k.$.parseJSON(a)},a.X=!0):a.W=function(){return null};a.Db=function(c){var b,d,f;a.Za()&&2047<c.length&&("undefined"!=
    typeof XMLHttpRequest&&(b=new XMLHttpRequest,"withCredentials"in b?d=1:b=0),b||"undefined"==typeof XDomainRequest||(b=new XDomainRequest,d=2),b&&(a.AudienceManagement&&a.AudienceManagement.isReady()||0!=a.usePostbacks)&&(a.X?b.xa=!0:b=0));!b&&a.Oa&&(c=c.substring(0,2047));!b&&a.d.createElement&&(0!=a.usePostbacks||a.AudienceManagement&&a.AudienceManagement.isReady())&&(b=a.d.createElement("SCRIPT"))&&"async"in b&&((f=(f=a.d.getElementsByTagName("HEAD"))&&f[0]?f[0]:a.d.body)?(b.type="text/javascript",
    b.setAttribute("async","async"),d=3):b=0);b||(b=new Image,b.alt="",b.abort||"undefined"===typeof k.InstallTrigger||(b.abort=function(){b.src=q}));b.za=function(){try{b.F&&(clearTimeout(b.F),b.F=0)}catch(a){}};b.onload=b.ua=function(){b.za();a.lb();a.fa();a.q=0;a.ja();if(b.xa){b.xa=!1;try{a.doPostbacks(a.W(b.responseText))}catch(c){}}};b.onabort=b.onerror=b.Ca=function(){b.za();(a.trackOffline||a.pa)&&a.q&&a.i.unshift(a.kb);a.q=0;a.la>a.N&&a.La(a.i);a.fa();a.ta(500)};b.onreadystatechange=function(){4==
    b.readyState&&(200==b.status?b.ua():b.Ca())};a.Ka=a.C();if(1==d||2==d){var e=c.indexOf("?");f=c.substring(0,e);e=c.substring(e+1);e=e.replace(/&callback=[a-zA-Z0-9_.\[\]]+/,"");1==d?(b.open("POST",f,!0),b.send(e)):2==d&&(b.open("POST",f),b.send(e))}else if(b.src=c,3==d){if(a.Ia)try{f.removeChild(a.Ia)}catch(g){}f.firstChild?f.insertBefore(b,f.firstChild):f.appendChild(b);a.Ia=a.B}b.F=setTimeout(function(){b.F&&(b.complete?b.ua():(a.trackOffline&&b.abort&&b.abort(),b.Ca()))},5E3);a.kb=c;a.B=k["s_i_"+
    a.replace(a.account,",","_")]=b;if(a.useForcedLinkTracking&&a.J||a.A)a.forcedLinkTrackingTimeout||(a.forcedLinkTrackingTimeout=250),a.ga=setTimeout(a.fa,a.forcedLinkTrackingTimeout)};a.lb=function(){if(a.qa()&&!(a.Ja>a.N))try{k.localStorage.removeItem(a.oa()),a.Ja=a.C()}catch(c){}};a.La=function(c){if(a.qa()){a.Na();try{k.localStorage.setItem(a.oa(),k.JSON.stringify(c)),a.N=a.C()}catch(b){}}};a.Na=function(){if(a.trackOffline){if(!a.offlineLimit||0>=a.offlineLimit)a.offlineLimit=10;for(;a.i.length>
    a.offlineLimit;)a.Ba()}};a.forceOffline=function(){a.pa=!0};a.forceOnline=function(){a.pa=!1};a.oa=function(){return a.offlineFilename+"-"+a.visitorNamespace+a.account};a.C=function(){return(new Date).getTime()};a.Ga=function(a){a=a.toLowerCase();return 0!=a.indexOf("#")&&0!=a.indexOf("about:")&&0!=a.indexOf("opera:")&&0!=a.indexOf("javascript:")?!0:!1};a.setTagContainer=function(c){var b,d,f;a.Eb=c;for(b=0;b<a._il.length;b++)if((d=a._il[b])&&"s_l"==d._c&&d.tagContainerName==c){a.Q(d);if(d.lmq)for(b=
    0;b<d.lmq.length;b++)f=d.lmq[b],a.loadModule(f.n);if(d.ml)for(f in d.ml)if(a[f])for(b in c=a[f],f=d.ml[f],f)!Object.prototype[b]&&("function"!=typeof f[b]||0>(""+f[b]).indexOf("s_c_il"))&&(c[b]=f[b]);if(d.mmq)for(b=0;b<d.mmq.length;b++)f=d.mmq[b],a[f.m]&&(c=a[f.m],c[f.f]&&"function"==typeof c[f.f]&&(f.a?c[f.f].apply(c,f.a):c[f.f].apply(c)));if(d.tq)for(b=0;b<d.tq.length;b++)a.track(d.tq[b]);d.s=a;break}};a.Util={urlEncode:a.escape,urlDecode:a.unescape,cookieRead:a.cookieRead,cookieWrite:a.cookieWrite,
    getQueryParam:function(c,b,d){var f;b||(b=a.pageURL?a.pageURL:k.location);d||(d="&");return c&&b&&(b=""+b,f=b.indexOf("?"),0<=f&&(b=d+b.substring(f+1)+d,f=b.indexOf(d+c+"="),0<=f&&(b=b.substring(f+d.length+c.length+1),f=b.indexOf(d),0<=f&&(b=b.substring(0,f)),0<b.length)))?a.unescape(b):""}};a.G="supplementalDataID timestamp dynamicVariablePrefix visitorID marketingCloudVisitorID analyticsVisitorID audienceManagerLocationHint authState fid vmk visitorMigrationKey visitorMigrationServer visitorMigrationServerSecure charSet visitorNamespace cookieDomainPeriods fpCookieDomainPeriods cookieLifetime pageName pageURL referrer contextData currencyCode lightProfileID lightStoreForSeconds lightIncrementBy retrieveLightProfiles deleteLightProfiles retrieveLightData".split(" ");
    a.g=a.G.concat("purchaseID variableProvider channel server pageType transactionID campaign state zip events events2 products audienceManagerBlob tnt".split(" "));a.ma="timestamp charSet visitorNamespace cookieDomainPeriods cookieLifetime contextData lightProfileID lightStoreForSeconds lightIncrementBy".split(" ");a.O=a.ma.slice(0);a.wa="account allAccounts debugTracking visitor visitorOptedOut trackOffline offlineLimit offlineThrottleDelay offlineFilename usePlugins doPlugins configURL visitorSampling visitorSamplingGroup linkObject clickObject linkURL linkName linkType trackDownloadLinks trackExternalLinks trackClickMap trackInlineStats linkLeaveQueryString linkTrackVars linkTrackEvents linkDownloadFileTypes linkExternalFilters linkInternalFilters useForcedLinkTracking forcedLinkTrackingTimeout trackingServer trackingServerSecure ssl abort mobile dc lightTrackVars maxDelay expectSupplementalData usePostbacks AudienceManagement".split(" ");
    for(n=0;250>=n;n++)76>n&&(a.g.push("prop"+n),a.O.push("prop"+n)),a.g.push("eVar"+n),a.O.push("eVar"+n),6>n&&a.g.push("hier"+n),4>n&&a.g.push("list"+n);n="pe pev1 pev2 pev3 latitude longitude resolution colorDepth javascriptVersion javaEnabled cookiesEnabled browserWidth browserHeight connectionType homepage pageURLRest".split(" ");a.g=a.g.concat(n);a.G=a.G.concat(n);a.ssl=0<=k.location.protocol.toLowerCase().indexOf("https");a.charSet="UTF-8";a.contextData={};a.offlineThrottleDelay=0;a.offlineFilename=
    "AppMeasurement.offline";a.Ka=0;a.la=0;a.N=0;a.Ja=0;a.linkDownloadFileTypes="exe,zip,wav,mp3,mov,mpg,avi,wmv,pdf,doc,docx,xls,xlsx,ppt,pptx";a.w=k;a.d=k.document;try{if(a.Oa=!1,navigator){var y=navigator.userAgent;if("Microsoft Internet Explorer"==navigator.appName||0<=y.indexOf("MSIE ")||0<=y.indexOf("Trident/")&&0<=y.indexOf("Windows NT 6"))a.Oa=!0}}catch(z){}a.fa=function(){a.ga&&(k.clearTimeout(a.ga),a.ga=q);a.l&&a.J&&a.l.dispatchEvent(a.J);a.A&&("function"==typeof a.A?a.A():a.l&&a.l.href&&(a.d.location=
    a.l.href));a.l=a.J=a.A=0};a.Ma=function(){a.b=a.d.body;a.b?(a.v=function(c){var b,d,f,e,g;if(!(a.d&&a.d.getElementById("cppXYctnr")||c&&c["s_fe_"+a._in])){if(a.ya)if(a.useForcedLinkTracking)a.b.removeEventListener("click",a.v,!1);else{a.b.removeEventListener("click",a.v,!0);a.ya=a.useForcedLinkTracking=0;return}else a.useForcedLinkTracking=0;a.clickObject=c.srcElement?c.srcElement:c.target;try{if(!a.clickObject||a.M&&a.M==a.clickObject||!(a.clickObject.tagName||a.clickObject.parentElement||a.clickObject.parentNode))a.clickObject=
    0;else{var m=a.M=a.clickObject;a.ka&&(clearTimeout(a.ka),a.ka=0);a.ka=setTimeout(function(){a.M==m&&(a.M=0)},1E4);f=a.Ea();a.track();if(f<a.Ea()&&a.useForcedLinkTracking&&c.target){for(e=c.target;e&&e!=a.b&&"A"!=e.tagName.toUpperCase()&&"AREA"!=e.tagName.toUpperCase();)e=e.parentNode;if(e&&(g=e.href,a.Ga(g)||(g=0),d=e.target,c.target.dispatchEvent&&g&&(!d||"_self"==d||"_top"==d||"_parent"==d||k.name&&d==k.name))){try{b=a.d.createEvent("MouseEvents")}catch(n){b=new k.MouseEvent}if(b){try{b.initMouseEvent("click",
    c.bubbles,c.cancelable,c.view,c.detail,c.screenX,c.screenY,c.clientX,c.clientY,c.ctrlKey,c.altKey,c.shiftKey,c.metaKey,c.button,c.relatedTarget)}catch(q){b=0}b&&(b["s_fe_"+a._in]=b.s_fe=1,c.stopPropagation(),c.stopImmediatePropagation&&c.stopImmediatePropagation(),c.preventDefault(),a.l=c.target,a.J=b)}}}}}catch(r){a.clickObject=0}}},a.b&&a.b.attachEvent?a.b.attachEvent("onclick",a.v):a.b&&a.b.addEventListener&&(navigator&&(0<=navigator.userAgent.indexOf("WebKit")&&a.d.createEvent||0<=navigator.userAgent.indexOf("Firefox/2")&&
    k.MouseEvent)&&(a.ya=1,a.useForcedLinkTracking=1,a.b.addEventListener("click",a.v,!0)),a.b.addEventListener("click",a.v,!1))):setTimeout(a.Ma,30)};a.Ma();a.loadModule("ActivityMap")}
    function s_gi(a){var k,q=window.s_c_il,r,n,t=a.split(","),u,s,x=0;if(q)for(r=0;!x&&r<q.length;){k=q[r];if("s_c"==k._c&&(k.account||k.oun))if(k.account&&k.account==a)x=1;else for(n=k.account?k.account:k.oun,n=k.allAccounts?k.allAccounts:n.split(","),u=0;u<t.length;u++)for(s=0;s<n.length;s++)t[u]==n[s]&&(x=1);r++}x||(k=new AppMeasurement);k.setAccount?k.setAccount(a):k.sa&&k.sa(a);return k}AppMeasurement.getInstance=s_gi;window.s_objectID||(window.s_objectID=0);
    function s_pgicq(){var a=window,k=a.s_giq,q,r,n;if(k)for(q=0;q<k.length;q++)r=k[q],n=s_gi(r.oun),n.setAccount(r.un),n.setTagContainer(r.tagContainerName);a.s_giq=0}s_pgicq();

    /*eslint-enable */
/* jshint ignore:end */
} catch (e) {
  _neo.nebu('adobeAppMeas', e);
}

/* istanbul ignore next */

try {
    /* jshint ignore:start */
    /*eslint-disable */

    /* Updated per DAT-2304 */
    /*
     ============== DO NOT ALTER ANYTHING BELOW THIS LINE ! ============

     Adobe Visitor API for JavaScript version: 1.9.0
     Copyright 1996-2015 Adobe, Inc. All Rights Reserved
     More info available at http://www.omniture.com
    */
    function Visitor(q,v){if(!q)throw"Visitor requires Adobe Marketing Cloud Org ID";var a=this;a.version="1.9.0";var m=window,l=m.Visitor;l.version=a.version;m.s_c_in||(m.s_c_il=[],m.s_c_in=0);a._c="Visitor";a._il=m.s_c_il;a._in=m.s_c_in;a._il[a._in]=a;m.s_c_in++;a.ha={Da:[]};var t=m.document,i=l.Bb;i||(i=null);var D=l.Cb;D||(D=void 0);var j=l.La;j||(j=!0);var k=l.Ja;k||(k=!1);a.da=function(a){var c=0,b,e;if(a)for(b=0;b<a.length;b++)e=a.charCodeAt(b),c=(c<<5)-c+e,c&=c;return c};a.r=function(a,c){var b=
    "0123456789",e="",f="",g,h,i=8,k=10,l=10;c===n&&(w.isClientSideMarketingCloudVisitorID=j);if(1==a){b+="ABCDEF";for(g=0;16>g;g++)h=Math.floor(Math.random()*i),e+=b.substring(h,h+1),h=Math.floor(Math.random()*i),f+=b.substring(h,h+1),i=16;return e+"-"+f}for(g=0;19>g;g++)h=Math.floor(Math.random()*k),e+=b.substring(h,h+1),0==g&&9==h?k=3:(1==g||2==g)&&10!=k&&2>h?k=10:2<g&&(k=10),h=Math.floor(Math.random()*l),f+=b.substring(h,h+1),0==g&&9==h?l=3:(1==g||2==g)&&10!=l&&2>h?l=10:2<g&&(l=10);return e+f};a.Pa=
    function(){var a;!a&&m.location&&(a=m.location.hostname);if(a)if(/^[0-9.]+$/.test(a))a="";else{var c=a.split("."),b=c.length-1,e=b-1;1<b&&2>=c[b].length&&(2==c[b-1].length||0>",ac,ad,ae,af,ag,ai,al,am,an,ao,aq,ar,as,at,au,aw,ax,az,ba,bb,be,bf,bg,bh,bi,bj,bm,bo,br,bs,bt,bv,bw,by,bz,ca,cc,cd,cf,cg,ch,ci,cl,cm,cn,co,cr,cu,cv,cw,cx,cz,de,dj,dk,dm,do,dz,ec,ee,eg,es,et,eu,fi,fm,fo,fr,ga,gb,gd,ge,gf,gg,gh,gi,gl,gm,gn,gp,gq,gr,gs,gt,gw,gy,hk,hm,hn,hr,ht,hu,id,ie,im,in,io,iq,ir,is,it,je,jo,jp,kg,ki,km,kn,kp,kr,ky,kz,la,lb,lc,li,lk,lr,ls,lt,lu,lv,ly,ma,mc,md,me,mg,mh,mk,ml,mn,mo,mp,mq,mr,ms,mt,mu,mv,mw,mx,my,na,nc,ne,nf,ng,nl,no,nr,nu,nz,om,pa,pe,pf,ph,pk,pl,pm,pn,pr,ps,pt,pw,py,qa,re,ro,rs,ru,rw,sa,sb,sc,sd,se,sg,sh,si,sj,sk,sl,sm,sn,so,sr,st,su,sv,sx,sy,sz,tc,td,tf,tg,th,tj,tk,tl,tm,tn,to,tp,tr,tt,tv,tw,tz,ua,ug,uk,us,uy,uz,va,vc,ve,vg,vi,vn,vu,wf,ws,yt,".indexOf(","+
    c[b]+","))&&e--;if(0<e)for(a="";b>=e;)a=c[b]+(a?".":"")+a,b--}return a};a.cookieRead=function(a){var a=encodeURIComponent(a),c=(";"+t.cookie).split(" ").join(";"),b=c.indexOf(";"+a+"="),e=0>b?b:c.indexOf(";",b+1);return 0>b?"":decodeURIComponent(c.substring(b+2+a.length,0>e?c.length:e))};a.cookieWrite=function(d,c,b){var e=a.cookieLifetime,f,c=""+c,e=e?(""+e).toUpperCase():"";b&&"SESSION"!=e&&"NONE"!=e?(f=""!=c?parseInt(e?e:0,10):-60)?(b=new Date,b.setTime(b.getTime()+1E3*f)):1==b&&(b=new Date,f=
    b.getYear(),b.setYear(f+2+(1900>f?1900:0))):b=0;return d&&"NONE"!=e?(t.cookie=encodeURIComponent(d)+"="+encodeURIComponent(c)+"; path=/;"+(b?" expires="+b.toGMTString()+";":"")+(a.cookieDomain?" domain="+a.cookieDomain+";":""),a.cookieRead(d)==c):0};a.h=i;a.J=function(a,c){try{"function"==typeof a?a.apply(m,c):a[1].apply(a[0],c)}catch(b){}};a.Va=function(d,c){c&&(a.h==i&&(a.h={}),a.h[d]==D&&(a.h[d]=[]),a.h[d].push(c))};a.q=function(d,c){if(a.h!=i){var b=a.h[d];if(b)for(;0<b.length;)a.J(b.shift(),
    c)}};a.v=function(a,c,b,e){b=encodeURIComponent(c)+"="+encodeURIComponent(b);c=x.ub(a);a=x.lb(a);if(-1===a.indexOf("?"))return a+"?"+b+c;var f=a.split("?"),a=f[0]+"?",e=x.Ya(f[1],b,e);return a+e+c};a.Oa=function(a,c){var b=RegExp("[\\?&#]"+c+"=([^&#]*)").exec(a);if(b&&b.length)return decodeURIComponent(b[1])};a.Ua=function(){var d=i,c=m.location.href;try{var b=a.Oa(c,r.Y);if(b)for(var d={},e=b.split("|"),c=0,f=e.length;c<f;c++){var g=e[c].split("=");d[g[0]]=decodeURIComponent(g[1])}return d}catch(h){}};
    a.Ma=function(){var d=a.Ua();if(d){var c=d[n],b=a.setMarketingCloudVisitorID;c&&c.match(r.u)&&b(c);a.j(s,-1);d=d[p];c=a.setAnalyticsVisitorID;d&&d.match(r.u)&&c(d)}};a.Ta=function(d){function c(d){x.ob(d)&&a.setCustomerIDs(d)}function b(d){d=d||{};a._supplementalDataIDCurrent=d.supplementalDataIDCurrent||"";a._supplementalDataIDCurrentConsumed=d.supplementalDataIDCurrentConsumed||{};a._supplementalDataIDLast=d.supplementalDataIDLast||"";a._supplementalDataIDLastConsumed=d.supplementalDataIDLastConsumed||
    {}}d&&d[a.marketingCloudOrgID]&&(d=d[a.marketingCloudOrgID],c(d.customerIDs),b(d.sdid))};a.l=i;a.Ra=function(d,c,b,e){c=a.v(c,"d_fieldgroup",d,1);e.url=a.v(e.url,"d_fieldgroup",d,1);e.m=a.v(e.m,"d_fieldgroup",d,1);w.d[d]=j;e===Object(e)&&e.m&&"XMLHttpRequest"===a.ja.C.D?a.ja.hb(e,b,d):a.useCORSOnly||a.ga(d,c,b)};a.ga=function(d,c,b){var e=0,f=0,g;if(c&&t){for(g=0;!e&&2>g;){try{e=(e=t.getElementsByTagName(0<g?"HEAD":"head"))&&0<e.length?e[0]:0}catch(h){e=0}g++}if(!e)try{t.body&&(e=t.body)}catch(k){e=
    0}if(e)for(g=0;!f&&2>g;){try{f=t.createElement(0<g?"SCRIPT":"script")}catch(l){f=0}g++}}!c||!e||!f?b&&b():(f.type="text/javascript",f.src=c,e.firstChild?e.insertBefore(f,e.firstChild):e.appendChild(f),e=a.loadTimeout,o.d[d]={requestStart:o.o(),url:c,sa:e,qa:o.wa(),ra:0},b&&(a.l==i&&(a.l={}),a.l[d]=setTimeout(function(){b(j)},e)),a.ha.Da.push(c))};a.Na=function(d){a.l!=i&&a.l[d]&&(clearTimeout(a.l[d]),a.l[d]=0)};a.ea=k;a.fa=k;a.isAllowed=function(){if(!a.ea&&(a.ea=j,a.cookieRead(a.cookieName)||a.cookieWrite(a.cookieName,
    "T",1)))a.fa=j;return a.fa};a.b=i;a.c=i;var E=l.Tb;E||(E="MC");var n=l.Zb;n||(n="MCMID");var G=l.Ub;G||(G="MCCIDH");var J=l.Xb;J||(J="MCSYNCS");var H=l.Yb;H||(H="MCSYNCSOP");var I=l.Vb;I||(I="MCIDTS");var A=l.Wb;A||(A="MCOPTOUT");var C=l.Rb;C||(C="A");var p=l.Ob;p||(p="MCAID");var B=l.Sb;B||(B="AAM");var y=l.Qb;y||(y="MCAAMLH");var s=l.Pb;s||(s="MCAAMB");var u=l.$b;u||(u="NONE");a.L=0;a.ca=function(){if(!a.L){var d=a.version;a.audienceManagerServer&&(d+="|"+a.audienceManagerServer);a.audienceManagerServerSecure&&
    (d+="|"+a.audienceManagerServerSecure);a.L=a.da(d)}return a.L};a.ia=k;a.f=function(){if(!a.ia){a.ia=j;var d=a.ca(),c=k,b=a.cookieRead(a.cookieName),e,f,g,h,l=new Date;a.b==i&&(a.b={});if(b&&"T"!=b){b=b.split("|");b[0].match(/^[\-0-9]+$/)&&(parseInt(b[0],10)!=d&&(c=j),b.shift());1==b.length%2&&b.pop();for(d=0;d<b.length;d+=2)if(e=b[d].split("-"),f=e[0],g=b[d+1],1<e.length?(h=parseInt(e[1],10),e=0<e[1].indexOf("s")):(h=0,e=k),c&&(f==G&&(g=""),0<h&&(h=l.getTime()/1E3-60)),f&&g&&(a.e(f,g,1),0<h&&(a.b["expire"+
    f]=h+(e?"s":""),l.getTime()>=1E3*h||e&&!a.cookieRead(a.sessionCookieName))))a.c||(a.c={}),a.c[f]=j}c=a.loadSSL?!!a.trackingServerSecure:!!a.trackingServer;if(!a.a(p)&&c&&(b=a.cookieRead("s_vi")))b=b.split("|"),1<b.length&&0<=b[0].indexOf("v1")&&(g=b[1],d=g.indexOf("["),0<=d&&(g=g.substring(0,d)),g&&g.match(r.u)&&a.e(p,g))}};a.Xa=function(){var d=a.ca(),c,b;for(c in a.b)!Object.prototype[c]&&a.b[c]&&"expire"!=c.substring(0,6)&&(b=a.b[c],d+=(d?"|":"")+c+(a.b["expire"+c]?"-"+a.b["expire"+c]:"")+"|"+
    b);a.cookieWrite(a.cookieName,d,1)};a.a=function(d,c){return a.b!=i&&(c||!a.c||!a.c[d])?a.b[d]:i};a.e=function(d,c,b){a.b==i&&(a.b={});a.b[d]=c;b||a.Xa()};a.Qa=function(d,c){var b=a.a(d,c);return b?b.split("*"):i};a.Wa=function(d,c,b){a.e(d,c?c.join("*"):"",b)};a.Ib=function(d,c){var b=a.Qa(d,c);if(b){var e={},f;for(f=0;f<b.length;f+=2)e[b[f]]=b[f+1];return e}return i};a.Kb=function(d,c,b){var e=i,f;if(c)for(f in e=[],c)Object.prototype[f]||(e.push(f),e.push(c[f]));a.Wa(d,e,b)};a.j=function(d,c,b){var e=
    new Date;e.setTime(e.getTime()+1E3*c);a.b==i&&(a.b={});a.b["expire"+d]=Math.floor(e.getTime()/1E3)+(b?"s":"");0>c?(a.c||(a.c={}),a.c[d]=j):a.c&&(a.c[d]=k);b&&(a.cookieRead(a.sessionCookieName)||a.cookieWrite(a.sessionCookieName,"1"))};a.ba=function(a){if(a&&("object"==typeof a&&(a=a.d_mid?a.d_mid:a.visitorID?a.visitorID:a.id?a.id:a.uuid?a.uuid:""+a),a&&(a=a.toUpperCase(),"NOTARGET"==a&&(a=u)),!a||a!=u&&!a.match(r.u)))a="";return a};a.k=function(d,c){a.Na(d);a.i!=i&&(a.i[d]=k);o.d[d]&&(o.d[d].zb=o.o(),
    o.I(d));w.d[d]&&w.Fa(d,k);if(d==E){w.isClientSideMarketingCloudVisitorID!==j&&(w.isClientSideMarketingCloudVisitorID=k);var b=a.a(n);if(!b){b="object"==typeof c&&c.mid?c.mid:a.ba(c);if(!b){if(a.B){a.getAnalyticsVisitorID(i,k,j);return}b=a.r(0,n)}a.e(n,b)}if(!b||b==u)b="";"object"==typeof c&&((c.d_region||c.dcs_region||c.d_blob||c.blob)&&a.k(B,c),a.B&&c.mid&&a.k(C,{id:c.id}));a.q(n,[b])}if(d==B&&"object"==typeof c){b=604800;c.id_sync_ttl!=D&&c.id_sync_ttl&&(b=parseInt(c.id_sync_ttl,10));var e=a.a(y);
    e||((e=c.d_region)||(e=c.dcs_region),e&&(a.j(y,b),a.e(y,e)));e||(e="");a.q(y,[e]);e=a.a(s);if(c.d_blob||c.blob)(e=c.d_blob)||(e=c.blob),a.j(s,b),a.e(s,e);e||(e="");a.q(s,[e]);!c.error_msg&&a.A&&a.e(G,a.A)}if(d==C){b=a.a(p);b||((b=a.ba(c))?b!==u&&a.j(s,-1):b=u,a.e(p,b));if(!b||b==u)b="";a.q(p,[b])}a.idSyncDisableSyncs?z.xa=j:(z.xa=k,b={},b.ibs=c.ibs,b.subdomain=c.subdomain,z.vb(b));if(c===Object(c)){var f;a.isAllowed()&&(f=a.a(A));f||(f=u,c.d_optout&&c.d_optout instanceof Array&&(f=c.d_optout.join(",")),
    b=parseInt(c.d_ottl,10),isNaN(b)&&(b=7200),a.j(A,b,j),a.e(A,f));a.q(A,[f])}};a.i=i;a.s=function(d,c,b,e,f){var g="",h,k=x.nb(d);if(a.isAllowed()&&(a.f(),g=a.a(d,K[d]===j),a.disableThirdPartyCalls&&!g&&(d===n?(g=a.r(0,n),a.setMarketingCloudVisitorID(g)):d===p&&!k&&(g="",a.setAnalyticsVisitorID(g))),(!g||a.c&&a.c[d])&&(!a.disableThirdPartyCalls||k)))if(d==n||d==A?h=E:d==y||d==s?h=B:d==p&&(h=C),h){if(c&&(a.i==i||!a.i[h]))a.i==i&&(a.i={}),a.i[h]=j,a.Ra(h,c,function(b,c){if(!a.a(d))if(o.d[h]&&(o.d[h].timeout=
    o.o(),o.d[h].mb=!!b,o.I(h)),c===Object(c)&&!a.useCORSOnly)a.ga(h,c.url,c.G);else{b&&w.Fa(h,j);var e="";d==n?e=a.r(0,n):h==B&&(e={error_msg:"timeout"});a.k(h,e)}},f);if(g)return g;a.Va(d,b);c||a.k(h,{id:u});return""}if((d==n||d==p)&&g==u)g="",e=j;b&&e&&a.J(b,[g]);return g};a._setMarketingCloudFields=function(d){a.f();a.k(E,d)};a.setMarketingCloudVisitorID=function(d){a._setMarketingCloudFields(d)};a.B=k;a.getMarketingCloudVisitorID=function(d,c){if(a.isAllowed()){a.marketingCloudServer&&0>a.marketingCloudServer.indexOf(".demdex.net")&&
    (a.B=j);var b=a.z("_setMarketingCloudFields");return a.s(n,b.url,d,c,b)}return""};a.Sa=function(){a.getAudienceManagerBlob()};l.AuthState={UNKNOWN:0,AUTHENTICATED:1,LOGGED_OUT:2};a.w={};a.aa=k;a.A="";a.setCustomerIDs=function(d){if(a.isAllowed()&&d){a.f();var c,b;for(c in d)if(!Object.prototype[c]&&(b=d[c]))if("object"==typeof b){var e={};b.id&&(e.id=b.id);b.authState!=D&&(e.authState=b.authState);a.w[c]=e}else a.w[c]={id:b};var d=a.getCustomerIDs(),e=a.a(G),f="";e||(e=0);for(c in d)Object.prototype[c]||
    (b=d[c],f+=(f?"|":"")+c+"|"+(b.id?b.id:"")+(b.authState?b.authState:""));a.A=a.da(f);a.A!=e&&(a.aa=j,a.Sa())}};a.getCustomerIDs=function(){a.f();var d={},c,b;for(c in a.w)Object.prototype[c]||(b=a.w[c],d[c]||(d[c]={}),b.id&&(d[c].id=b.id),d[c].authState=b.authState!=D?b.authState:l.AuthState.UNKNOWN);return d};a._setAnalyticsFields=function(d){a.f();a.k(C,d)};a.setAnalyticsVisitorID=function(d){a._setAnalyticsFields(d)};a.getAnalyticsVisitorID=function(d,c,b){if(a.isAllowed()){var e="";b||(e=a.getMarketingCloudVisitorID(function(){a.getAnalyticsVisitorID(d,
    j)}));if(e||b){var f=b?a.marketingCloudServer:a.trackingServer,g="";a.loadSSL&&(b?a.marketingCloudServerSecure&&(f=a.marketingCloudServerSecure):a.trackingServerSecure&&(f=a.trackingServerSecure));var h={};if(f){var f="http"+(a.loadSSL?"s":"")+"://"+f+"/id",e="d_visid_ver="+a.version+"&mcorgid="+encodeURIComponent(a.marketingCloudOrgID)+(e?"&mid="+encodeURIComponent(e):"")+(a.idSyncDisable3rdPartySyncing?"&d_coppa=true":""),i=["s_c_il",a._in,"_set"+(b?"MarketingCloud":"Analytics")+"Fields"],g=f+"?"+
    e+"&callback=s_c_il%5B"+a._in+"%5D._set"+(b?"MarketingCloud":"Analytics")+"Fields";h.m=f+"?"+e;h.na=i}h.url=g;return a.s(b?n:p,g,d,c,h)}}return""};a._setAudienceManagerFields=function(d){a.f();a.k(B,d)};a.z=function(d){var c=a.audienceManagerServer,b="",e=a.a(n),f=a.a(s,j),g=a.a(p),g=g&&g!=u?"&d_cid_ic=AVID%01"+encodeURIComponent(g):"";a.loadSSL&&a.audienceManagerServerSecure&&(c=a.audienceManagerServerSecure);if(c){var b=a.getCustomerIDs(),h,i;if(b)for(h in b)Object.prototype[h]||(i=b[h],g+="&d_cid_ic="+
    encodeURIComponent(h)+"%01"+encodeURIComponent(i.id?i.id:"")+(i.authState?"%01"+i.authState:""));d||(d="_setAudienceManagerFields");c="http"+(a.loadSSL?"s":"")+"://"+c+"/id";e="d_visid_ver="+a.version+"&d_rtbd=json&d_ver=2"+(!e&&a.B?"&d_verify=1":"")+"&d_orgid="+encodeURIComponent(a.marketingCloudOrgID)+"&d_nsid="+(a.idSyncContainerID||0)+(e?"&d_mid="+encodeURIComponent(e):"")+(a.idSyncDisable3rdPartySyncing?"&d_coppa=true":"")+(f?"&d_blob="+encodeURIComponent(f):"")+g;f=["s_c_il",a._in,d];b=c+"?"+
    e+"&d_cb=s_c_il%5B"+a._in+"%5D."+d;return{url:b,m:c+"?"+e,na:f}}return{url:b}};a.getAudienceManagerLocationHint=function(d,c){if(a.isAllowed()&&a.getMarketingCloudVisitorID(function(){a.getAudienceManagerLocationHint(d,j)})){var b=a.a(p);b||(b=a.getAnalyticsVisitorID(function(){a.getAudienceManagerLocationHint(d,j)}));if(b)return b=a.z(),a.s(y,b.url,d,c,b)}return""};a.getAudienceManagerBlob=function(d,c){if(a.isAllowed()&&a.getMarketingCloudVisitorID(function(){a.getAudienceManagerBlob(d,j)})){var b=
    a.a(p);b||(b=a.getAnalyticsVisitorID(function(){a.getAudienceManagerBlob(d,j)}));if(b){var b=a.z(),e=b.url;a.aa&&a.j(s,-1);return a.s(s,e,d,c,b)}}return""};a._supplementalDataIDCurrent="";a._supplementalDataIDCurrentConsumed={};a._supplementalDataIDLast="";a._supplementalDataIDLastConsumed={};a.getSupplementalDataID=function(d,c){!a._supplementalDataIDCurrent&&!c&&(a._supplementalDataIDCurrent=a.r(1));var b=a._supplementalDataIDCurrent;a._supplementalDataIDLast&&!a._supplementalDataIDLastConsumed[d]?
    (b=a._supplementalDataIDLast,a._supplementalDataIDLastConsumed[d]=j):b&&(a._supplementalDataIDCurrentConsumed[d]&&(a._supplementalDataIDLast=a._supplementalDataIDCurrent,a._supplementalDataIDLastConsumed=a._supplementalDataIDCurrentConsumed,a._supplementalDataIDCurrent=b=!c?a.r(1):"",a._supplementalDataIDCurrentConsumed={}),b&&(a._supplementalDataIDCurrentConsumed[d]=j));return b};l.OptOut={GLOBAL:"global"};a.getOptOut=function(d,c){if(a.isAllowed()){var b=a.z("_setMarketingCloudFields");return a.s(A,
    b.url,d,c,b)}return""};a.isOptedOut=function(d,c,b){return a.isAllowed()?(c||(c=l.OptOut.GLOBAL),(b=a.getOptOut(function(b){a.J(d,[b==l.OptOut.GLOBAL||0<=b.indexOf(c)])},b))?b==l.OptOut.GLOBAL||0<=b.indexOf(c):i):k};a.appendVisitorIDsTo=function(d){for(var c=r.Y,b=[[n,a.a(n)],[p,a.a(p)]],e="",f=0,g=b.length;f<g;f++){var h=b[f],j=h[0],h=h[1];h!=i&&h!==u&&(e=e?e+="|":e,e+=j+"="+encodeURIComponent(h))}try{return a.v(d,c,e)}catch(k){return d}};var r={p:!!m.postMessage,Ia:1,$:864E5,Y:"adobe_mc",u:/^[0-9a-fA-F\-]+$/};
    a.Db=r;a.la={postMessage:function(a,c,b){var e=1;c&&(r.p?b.postMessage(a,c.replace(/([^:]+:\/\/[^\/]+).*/,"$1")):c&&(b.location=c.replace(/#.*$/,"")+"#"+ +new Date+e++ +"&"+a))},T:function(a,c){var b;try{if(r.p)if(a&&(b=function(b){if("string"===typeof c&&b.origin!==c||"[object Function]"===Object.prototype.toString.call(c)&&!1===c(b.origin))return!1;a(b)}),window.addEventListener)window[a?"addEventListener":"removeEventListener"]("message",b,!1);else window[a?"attachEvent":"detachEvent"]("onmessage",
    b)}catch(e){}}};var x={M:function(){if(t.addEventListener)return function(a,c,b){a.addEventListener(c,function(a){"function"===typeof b&&b(a)},k)};if(t.attachEvent)return function(a,c,b){a.attachEvent("on"+c,function(a){"function"===typeof b&&b(a)})}}(),map:function(a,c){if(Array.prototype.map)return a.map(c);if(void 0===a||a===i)throw new TypeError;var b=Object(a),e=b.length>>>0;if("function"!==typeof c)throw new TypeError;for(var f=Array(e),g=0;g<e;g++)g in b&&(f[g]=c.call(c,b[g],g,b));return f},
    gb:function(a,c){return this.map(a,function(a){return encodeURIComponent(a)}).join(c)},ub:function(a){var c=a.indexOf("#");return 0<c?a.substr(c):""},lb:function(a){var c=a.indexOf("#");return 0<c?a.substr(0,c):a},Ya:function(a,c,b){a=a.split("&");b=b!=i?b:a.length;a.splice(b,0,c);return a.join("&")},nb:function(d,c,b){if(d!==p)return k;c||(c=a.trackingServer);b||(b=a.trackingServerSecure);d=a.loadSSL?b:c;return"string"===typeof d&&d.length?0>d.indexOf("2o7.net")&&0>d.indexOf("omtrdc.net"):k},ob:function(a){return Boolean(a&&
    a===Object(a))}};a.Jb=x;var L={C:function(){var a="none",c=j;"undefined"!==typeof XMLHttpRequest&&XMLHttpRequest===Object(XMLHttpRequest)&&("withCredentials"in new XMLHttpRequest?a="XMLHttpRequest":(new Function("/*@cc_on return /^10/.test(@_jscript_version) @*/"))()?a="XMLHttpRequest":"undefined"!==typeof XDomainRequest&&XDomainRequest===Object(XDomainRequest)&&(c=k),0<Object.prototype.toString.call(window.Ab).indexOf("Constructor")&&(c=k));return{D:a,Mb:c}}(),ib:function(){return"none"===this.C.D?
    i:new window[this.C.D]},hb:function(d,c,b){var e=this;c&&(d.G=c);try{var f=this.ib();f.open("get",d.m+"&ts="+(new Date).getTime(),j);"XMLHttpRequest"===this.C.D&&(f.withCredentials=j,f.timeout=a.loadTimeout,f.setRequestHeader("Content-Type","application/x-www-form-urlencoded"),f.onreadystatechange=function(){if(4===this.readyState&&200===this.status)a:{var a;try{if(a=JSON.parse(this.responseText),a!==Object(a)){e.n(d,i,"Response is not JSON");break a}}catch(b){e.n(d,b,"Error parsing response as JSON");
    break a}try{for(var c=d.na,f=window,g=0;g<c.length;g++)f=f[c[g]];f(a)}catch(j){e.n(d,j,"Error forming callback function")}}});f.onerror=function(a){e.n(d,a,"onerror")};f.ontimeout=function(a){e.n(d,a,"ontimeout")};f.send();o.d[b]={requestStart:o.o(),url:d.m,sa:f.timeout,qa:o.wa(),ra:1};a.ha.Da.push(d.m)}catch(g){this.n(d,g,"try-catch")}},n:function(d,c,b){a.CORSErrors.push({Nb:d,error:c,description:b});d.G&&("ontimeout"===b?d.G(j):d.G(k,d))}};a.ja=L;var z={Ka:3E4,Z:649,Ha:k,id:i,S:[],P:i,va:function(a){if("string"===
    typeof a)return a=a.split("/"),a[0]+"//"+a[2]},g:i,url:i,jb:function(){var d="http://fast.",c="?d_nsid="+a.idSyncContainerID+"#"+encodeURIComponent(t.location.href);this.g||(this.g="nosubdomainreturned");a.loadSSL&&(d=a.idSyncSSLUseAkamai?"https://fast.":"https://");d=d+this.g+".demdex.net/dest5.html"+c;this.P=this.va(d);this.id="destination_publishing_iframe_"+this.g+"_"+a.idSyncContainerID;return d},ab:function(){var d="?d_nsid="+a.idSyncContainerID+"#"+encodeURIComponent(t.location.href);"string"===
    typeof a.K&&a.K.length&&(this.id="destination_publishing_iframe_"+(new Date).getTime()+"_"+a.idSyncContainerID,this.P=this.va(a.K),this.url=a.K+d)},xa:i,ta:k,V:k,F:i,ac:i,tb:i,bc:i,U:k,H:[],rb:[],sb:[],za:r.p?15:100,Q:[],pb:[],oa:j,Ca:k,Ba:function(){return!a.idSyncDisable3rdPartySyncing&&(this.ta||a.Fb)&&this.g&&"nosubdomainreturned"!==this.g&&this.url&&!this.V},N:function(){function a(){e=document.createElement("iframe");e.sandbox="allow-scripts allow-same-origin";e.title="Adobe ID Syncing iFrame";
    e.id=b.id;e.style.cssText="display: none; width: 0; height: 0;";e.src=b.url;b.tb=j;c();document.body.appendChild(e)}function c(){x.M(e,"load",function(){e.className="aamIframeLoaded";b.F=j;b.t()})}this.V=j;var b=this,e=document.getElementById(this.id);e?"IFRAME"!==e.nodeName?(this.id+="_2",a()):"aamIframeLoaded"!==e.className?c():(this.F=j,this.ya=e,this.t()):a();this.ya=e},t:function(d){var c=this;d===Object(d)&&(this.Q.push(d),this.wb(d));if((this.Ca||!r.p||this.F)&&this.Q.length)this.I(this.Q.shift()),
    this.t();!a.idSyncDisableSyncs&&this.F&&this.H.length&&!this.U&&(this.Ha||(this.Ha=j,setTimeout(function(){c.za=r.p?15:150},this.Ka)),this.U=j,this.Ea())},wb:function(a){var c,b,e;if((c=a.ibs)&&c instanceof Array&&(b=c.length))for(a=0;a<b;a++)e=c[a],e.syncOnPage&&this.pa(e,"","syncOnPage")},I:function(a){var c=encodeURIComponent,b,e,f,g,h;if((b=a.ibs)&&b instanceof Array&&(e=b.length))for(f=0;f<e;f++)g=b[f],h=[c("ibs"),c(g.id||""),c(g.tag||""),x.gb(g.url||[],","),c(g.ttl||""),"","",g.fireURLSync?
    "true":"false"],g.syncOnPage||(this.oa?this.ma(h.join("|")):g.fireURLSync&&this.pa(g,h.join("|")));this.pb.push(a)},pa:function(d,c,b){var e=(b="syncOnPage"===b?j:k)?H:J;a.f();var f=a.a(e),g=k,h=k,i=Math.ceil((new Date).getTime()/r.$);f?(f=f.split("*"),h=this.xb(f,d.id,i),g=h.eb,h=h.fb,(!g||!h)&&this.ua(b,d,c,f,e,i)):(f=[],this.ua(b,d,c,f,e,i))},xb:function(a,c,b){var e=k,f=k,g,h,i;for(h=0;h<a.length;h++)g=a[h],i=parseInt(g.split("-")[1],10),g.match("^"+c+"-")?(e=j,b<i?f=j:(a.splice(h,1),h--)):b>=
    i&&(a.splice(h,1),h--);return{eb:e,fb:f}},qb:function(a){if(a.join("*").length>this.Z)for(a.sort(function(a,b){return parseInt(a.split("-")[1],10)-parseInt(b.split("-")[1],10)});a.join("*").length>this.Z;)a.shift()},ua:function(d,c,b,e,f,g){var h=this;if(d){if("img"===c.tag){var d=c.url,b=a.loadSSL?"https:":"http:",j,k,l;for(e=0,j=d.length;e<j;e++){k=d[e];l=/^\/\//.test(k);var m=new Image;x.M(m,"load",function(b,c,d,e){return function(){h.S[b]=i;a.f();var g=a.a(f),j=[];if(g){var g=g.split("*"),k,
    l,m;for(k=0,l=g.length;k<l;k++)m=g[k],m.match("^"+c.id+"-")||j.push(m)}h.Ga(j,c,d,e)}}(this.S.length,c,f,g));m.src=(l?b:"")+k;this.S.push(m)}}}else this.ma(b),this.Ga(e,c,f,g)},ma:function(d){var c=encodeURIComponent;this.H.push((a.Gb?c("---destpub-debug---"):c("---destpub---"))+d)},Ga:function(d,c,b,e){d.push(c.id+"-"+(e+Math.ceil(c.ttl/60/24)));this.qb(d);a.e(b,d.join("*"))},Ea:function(){var d=this,c;this.H.length?(c=this.H.shift(),a.la.postMessage(c,this.url,this.ya.contentWindow),this.rb.push(c),
    setTimeout(function(){d.Ea()},this.za)):this.U=k},T:function(a){var c=/^---destpub-to-parent---/;"string"===typeof a&&c.test(a)&&(c=a.replace(c,"").split("|"),"canSetThirdPartyCookies"===c[0]&&(this.oa="true"===c[1]?j:k,this.Ca=j,this.t()),this.sb.push(a))},vb:function(d){if(this.url===i||d.subdomain&&"nosubdomainreturned"===this.g)this.g="string"===typeof a.ka&&a.ka.length?a.ka:d.subdomain||"",this.url=this.jb();d.ibs instanceof Array&&d.ibs.length&&(this.ta=j);this.Ba()&&(a.idSyncAttachIframeOnWindowLoad?
    (l.X||"complete"===t.readyState||"loaded"===t.readyState)&&this.N():this.Za());"function"===typeof a.idSyncIDCallResult?a.idSyncIDCallResult(d):this.t(d);"function"===typeof a.idSyncAfterIDCallResult&&a.idSyncAfterIDCallResult(d)},$a:function(d,c){return a.Hb||!d||c-d>r.Ia},Za:function(){function a(){c.V||(document.body?c.N():setTimeout(a,30))}var c=this;a()}};a.Eb=z;a.timeoutMetricsLog=[];var o={cb:window.performance&&window.performance.timing?1:0,Aa:window.performance&&window.performance.timing?
    window.performance.timing:i,W:i,O:i,d:{},R:[],send:function(d){if(a.takeTimeoutMetrics&&d===Object(d)){var c=[],b=encodeURIComponent,e;for(e in d)d.hasOwnProperty(e)&&c.push(b(e)+"="+b(d[e]));d="http"+(a.loadSSL?"s":"")+"://dpm.demdex.net/event?d_visid_ver="+a.version+"&d_visid_stg_timeout="+a.loadTimeout+"&"+c.join("&")+"&d_orgid="+b(a.marketingCloudOrgID)+"&d_timingapi="+this.cb+"&d_winload="+this.kb()+"&d_ld="+this.o();(new Image).src=d;a.timeoutMetricsLog.push(d)}},kb:function(){this.O===i&&(this.O=
    this.Aa?this.W-this.Aa.navigationStart:this.W-l.bb);return this.O},o:function(){return(new Date).getTime()},I:function(a){var c=this.d[a],b={};b.d_visid_stg_timeout_captured=c.sa;b.d_visid_cors=c.ra;b.d_fieldgroup=a;b.d_settimeout_overriden=c.qa;c.timeout?c.mb?(b.d_visid_timedout=1,b.d_visid_timeout=c.timeout-c.requestStart,b.d_visid_response=-1):(b.d_visid_timedout="n/a",b.d_visid_timeout="n/a",b.d_visid_response="n/a"):(b.d_visid_timedout=0,b.d_visid_timeout=-1,b.d_visid_response=c.zb-c.requestStart);
    b.d_visid_url=c.url;l.X?this.send(b):this.R.push(b);delete this.d[a]},yb:function(){for(var a=0,c=this.R.length;a<c;a++)this.send(this.R[a])},wa:function(){return"function"===typeof setTimeout.toString?-1<setTimeout.toString().indexOf("[native code]")?0:1:-1}};a.Lb=o;var w={isClientSideMarketingCloudVisitorID:i,MCIDCallTimedOut:i,AnalyticsIDCallTimedOut:i,AAMIDCallTimedOut:i,d:{},Fa:function(a,c){switch(a){case E:c===k?this.MCIDCallTimedOut!==j&&(this.MCIDCallTimedOut=k):this.MCIDCallTimedOut=c;break;
    case C:c===k?this.AnalyticsIDCallTimedOut!==j&&(this.AnalyticsIDCallTimedOut=k):this.AnalyticsIDCallTimedOut=c;break;case B:c===k?this.AAMIDCallTimedOut!==j&&(this.AAMIDCallTimedOut=k):this.AAMIDCallTimedOut=c}}};a.isClientSideMarketingCloudVisitorID=function(){return w.isClientSideMarketingCloudVisitorID};a.MCIDCallTimedOut=function(){return w.MCIDCallTimedOut};a.AnalyticsIDCallTimedOut=function(){return w.AnalyticsIDCallTimedOut};a.AAMIDCallTimedOut=function(){return w.AAMIDCallTimedOut};a.idSyncGetOnPageSyncInfo=
    function(){a.f();return a.a(H)};0>q.indexOf("@")&&(q+="@AdobeOrg");a.marketingCloudOrgID=q;a.cookieName="AMCV_"+q;a.sessionCookieName="AMCVS_"+q;a.cookieDomain=a.Pa();a.cookieDomain==m.location.hostname&&(a.cookieDomain="");a.loadSSL=0<=m.location.protocol.toLowerCase().indexOf("https");a.loadTimeout=3E4;a.CORSErrors=[];a.marketingCloudServer=a.audienceManagerServer="dpm.demdex.net";var K={};K[y]=j;K[s]=j;a.Ma();if(v&&"object"==typeof v){for(var F in v)!Object.prototype[F]&&(a[F]=v[F]);a.idSyncContainerID=
    a.idSyncContainerID||0;a.f();L=a.a(I);F=Math.ceil((new Date).getTime()/r.$);!a.idSyncDisableSyncs&&z.$a(L,F)&&(a.j(s,-1),a.e(I,F));a.getMarketingCloudVisitorID();a.getAudienceManagerLocationHint();a.getAudienceManagerBlob();a.Ta(a.serverState)}if(!a.idSyncDisableSyncs){z.ab();x.M(window,"load",function(){l.X=j;o.W=o.o();o.yb();var a=z;a.Ba()&&a.N()});try{a.la.T(function(a){z.T(a.data)},z.P)}catch(M){}}}
    Visitor.getInstance=function(q,v){var a,m=window.s_c_il,l;0>q.indexOf("@")&&(q+="@AdobeOrg");if(m)for(l=0;l<m.length;l++)if((a=m[l])&&"Visitor"==a._c&&a.marketingCloudOrgID==q)return a;return new Visitor(q,v)};(function(){function q(){v.X=a}var v=window.Visitor,a=v.La,m=v.Ja;a||(a=!0);m||(m=!1);window.addEventListener?window.addEventListener("load",q):window.attachEvent&&window.attachEvent("onload",q);v.bb=(new Date).getTime()})();

/* jshint ignore:end */

  if (_neo.cypher.isFPAllowed()) {
    var visitor = Visitor.getInstance('F0935E09512D2C270A490D4D@AdobeOrg', {
      trackingServer       : 'modus.nike.com', // same as s.trackingServer
      trackingServerSecure : 'smodus.nike.com', // same as s.trackingServerSecure

      // To enable CNAME support, add the following configuration variables
      // If you are not using CNAME, DO NOT include these variables
      marketingCloudServer       : 'modus.nike.com',
      marketingCloudServerSecure : 'smodus.nike.com', // same as s.trackingServerSecure
    });
  }
} catch (e) {
  _neo.nebu('adobeVisitorID', e);
}
/*eslint-enable */

try {

  var s_code_version = "tms_thirdparty_4.779.0";

  var bool = false;
  var app = _neo.jackin.getCookie('appId');
  var appIds = {
    'nrc': 'nikeplusappprod',
    'ntc': 'nikebrandapps',
    'nrcdev': 'nikeplusappdev',
    'ntcdev': 'nikebrandappsdev',
    'omegaswoosh': 'nikeomegaapp',
    'omegaswooshdev': 'nikeomegaappdev'
  };
  var hrefs = {
    'nikeplusappprod': /\?app=nrc/,
    'nikebrandapps': /\?app=ntc/,
    'nikeomegaapp': /\?appId=omegaswoosh/,
    'nikeomegaappdev': /\?appId=omegaswooshdev/,
    'nikeplusappdev': /(?=.*\&dev=true)(?=.*\?app=nrc)/,
    'nikebrandappsdev': /(?=.*\&dev=true)(?=.*\?app=ntc)/
  };

  for (var key in appIds) {
    if (key === app) {
      window.s_account = appIds[key];
      bool = true;
    }
  }
  if (bool === false) {
    for (var prop in hrefs) {
      if (hrefs[prop].test(window.location.href)) {
        window.s_account = prop;
      }
    }
  }

  if (!window.s_account || window.s_account === 'nikecomprod' || window.s_account === 'nikecomdev') {
    if ((app === "omega" || /appId=omega/.test(window.location.href)) && _neo.jackin.getCookie('omegaDev') === "true") {
      window.s_account = "nikeomegaappdev";
    } else if ((app === "omega" || /appId=omega/.test(window.location.href)) && !_neo.jackin.getCookie('omegaDev')) {
      window.s_account = "nikeomegaapp";
    } else if (/junta/.test(s_code_version) || /trainershub/.test(s_code_version)) {
      window.s_account = /test-web/.test(window.location.host) ? "nikebranddev" : "nikebrandprod";
    } else {
      window.s_account = /ecn/.test(window.location.host) ? "nikecomdev" : "nikecomprod";
    }
  }
  // filter out SiteCatalyst on ecn4 (performance testing)
  if (/ecn4-/.test(window.location.hostname)) {
    s = {
      t: function t() {},
      tl: function tl() {}
    };
  } else {
    s = s_gi(window.s_account);
  }
  s.trackDownloadLinks = true;
  s.trackExternalLinks = true;
  s.trackInlineStats = false;
  s.linkDownloadFileTypes = "exe,zip,wav,mp3,mov,mpg,avi,wmv,pdf,doc,docx,xls,xlsx,ppt,pptx,dmg";
  s.linkInternalFilters = "javascript:,nike.com,nikedev.com,bazaarvoice.com";
  s.linkLeaveQueryString = false;
  s.linkTrackVars = "server,prop2,prop3,prop7,prop9,prop10,prop11,prop12,prop13,prop14,prop15,prop17,prop20,prop21,prop24,prop25,prop26,prop28,prop30,prop31,prop37,prop38,prop44,prop45,prop49,prop50,prop54,prop58,prop59,prop65,prop68,prop69,prop74,prop83,eVar4,eVar8,eVar11,eVar12,eVar13,eVar16,eVar22,eVar23,eVar24,eVar25,eVar31,eVar48,eVar51,eVar53,eVar55,eVar56,eVar62,eVar72,eVar73,eVar79,eVar83";
  s.linkTrackEvents = "None";
  s.currencyCode = s.currencyCode || window.s_currencyCode || "";
  s.visitorNamespace = "nike";
  s.trackingServer = "modus.nike.com";
  s.trackingServerSecure = "smodus.nike.com";
  s.charSet = typeof s_charSet !== "undefined" ? s_charSet : "UTF-8";
  s.usePlugins = true;
  if (_neo.cypher.isFPAllowed()) {
    if (_neo.jackin.getQueryParameter('mcloudid', window.location.href)) {
      visitor.setMarketingCloudVisitorID(_neo.jackin.getQueryParameter('mcloudid', window.location.href));
    }
    s.visitor = Visitor.getInstance("F0935E09512D2C270A490D4D@AdobeOrg");
  }
  var dfaConfig = {
    CSID: '8893',
    SPOTID: '4171764',
    tEvar: 'eVar42',
    errorEvar: 'eVar44',
    timeoutEvent: 'event80',
    requestURL: "http://fls.doubleclick.net/json?spot=[SPOTID]&src=[CSID]&var=[VAR]&host=integrate.112.2o7.net%2Fdfa_echo%3Fvar%3D[VAR]%26AQE%3D1%26A2S%3D1&ord=[RAND]",
    maxDelay: "1000",
    visitCookie: "s_dfa",
    clickThroughParam: "cid",
    searchCenterParam: undefined,
    newRsidsProp: undefined
  };
} catch (e) {
  _neo.nebu('adobeConfig', e);
}
/* istanbul ignore next */

try {
/* jshint ignore:start */
/*eslint-disable */
    s.wd=window;
    s.fl=new Function("x","l",""
    +"return x?(''+x).substring(0,l):x");
    s.pt=new Function("x","d","f","a",""
    +"var s=this,t=x,z=0,y,r,l='length';while(t){y=t.indexOf(d);y=y<0?t[l"
    +"]:y;t=t.substring(0,y);r=s[f](t,a);if(r)return r;z+=y+d[l];t=x.subs"
    +"tring(z,x[l]);t=z<x[l]?t:''}return''");
    s.rep=new Function("x","o","n",""
    +"var a=new Array,i=0,j;if(x){if(x.split)a=x.split(o);else if(!o)for("
    +"i=0;i<x.length;i++)a[a.length]=x.substring(i,i+1);else while(i>=0){"
    +"j=x.indexOf(o,i);a[a.length]=x.substring(i,j<0?x.length:j);i=j;if(i"
    +">=0)i+=o.length}}x='';j=a.length;if(a&&j>0){x=a[0];if(j>1){if(a.joi"
    +"n)x=a.join(n);else for(i=1;i<j;i++)x+=n+a[i]}}return x");
    s.ape=new Function("x",""
    +"var s=this,h='0123456789ABCDEF',f='+~!*()\\'',i,c=s.charSet,n,l,e,y"
    +"='';c=c?c.toUpperCase():'';if(x){x=''+x;if(s.em==3){x=encodeURIComp"
    +"onent(x);for(i=0;i<f.length;i++){n=f.substring(i,i+1);if(x.indexOf("
    +"n)>=0)x=s.rep(x,n,'%'+n.charCodeAt(0).toString(16).toUpperCase())}}"
    +"else if(c=='AUTO'&&('').charCodeAt){for(i=0;i<x.length;i++){c=x.sub"
    +"string(i,i+1);n=x.charCodeAt(i);if(n>127){l=0;e='';while(n||l<4){e="
    +"h.substring(n%16,n%16+1)+e;n=(n-n%16)/16;l++}y+='%u'+e}else if(c=='"
    +"+')y+='%2B';else y+=escape(c)}x=y}else x=s.rep(escape(''+x),'+','%2"
    +"B');if(c&&c!='AUTO'&&s.em==1&&x.indexOf('%u')<0&&x.indexOf('%U')<0)"
    +"{i=x.indexOf('%');while(i>=0){i++;if(h.substring(8).indexOf(x.subst"
    +"ring(i,i+1).toUpperCase())>=0)return x.substring(0,i)+'u00'+x.subst"
    +"ring(i);i=x.indexOf('%',i)}}}return x");
    s.epa=new Function("x",""
    +"var s=this,y,tcf;if(x){x=s.rep(''+x,'+',' ');if(s.em==3){tcf=new Fu"
    +"nction('x','var y,e;try{y=decodeURIComponent(x)}catch(e){y=unescape"
    +"(x)}return y');return tcf(x)}else return unescape(x)}return y");


    s.apl = new Function("l", "v", "d", "u", "" + "var s=this,m=0;if(!l)l='';if(u){var i,n,a=s.split(l,d);for(i=0;i<a." + "length;i++){n=a[i];m=m||(u==1?(n==v):(n.toLowerCase()==v.toLowerCas" + "e()));}}if(!m)l=l?l+d+v:v;return l");

    /*
    * Plugin: getPercentPageViewed v2.01
    * DAT-1979, DAT-2372 (update)
    */
    s.handlePPVevents=function(){if(!s_c_il)return;for(var i=0,scill=s_c_il.length;i<scill;i++)if(typeof s_c_il[i]!="undefined"&&s_c_il[i]._c&&s_c_il[i]._c=="s_c"){var s=s_c_il[i];break}if(!s)return;if(!s.getPPVid)return;var dh=Math.max(Math.max(s.d.body.scrollHeight,s.d.documentElement.scrollHeight),Math.max(s.d.body.offsetHeight,s.d.documentElement.offsetHeight),Math.max(s.d.body.clientHeight,s.d.documentElement.clientHeight)),vph=window.innerHeight||(s.d.documentElement.clientHeight||s.d.body.clientHeight),
    st=window.pageYOffset||(window.document.documentElement.scrollTop||window.document.body.scrollTop),vh=st+vph,pv=Math.min(Math.round(vh/dh*100),100),c="",p=s.c_r("s_ppv").split(",")[0];if(!s.c_r("tp")||(s.unescape?s.unescape(p):decodeURIComponent(p))!=s.getPPVid||s.ppvChange=="1"&&(s.c_r("tp")&&dh!=s.c_r("tp"))){s.c_w("tp",dh);s.c_w("s_ppv","")}else c=s.c_r("s_ppv");var a=c&&c.indexOf(",")>-1?c.split(",",4):[],id=a.length>0?a[0]:escape(s.getPPVid),cv=a.length>1?parseInt(a[1]):0,p0=a.length>2?parseInt(a[2]):
    pv,cy=a.length>3?parseInt(a[3]):0,cn=pv>0?id+","+(pv>cv?pv:cv)+","+p0+","+(vh>cy?vh:cy):"";s.c_w("s_ppv",cn)};
    s.getPercentPageViewed=function(pid,change){var s=this,ist=!s.getPPVid?true:false;pid=pid?pid:s.pageName?s.pageName:document.location.href;s.ppvChange=change?change:"1";if(typeof s.linkType!="undefined"&&s.linkType!="0"&&s.linkType!=""&&s.linkType!="e")return"";var v=s.c_r("s_ppv"),a=v.indexOf(",")>-1?v.split(",",4):[];if(a&&a.length<4){for(var i=3;i>0;i--)a[i]=i<a.length?a[i-1]:"";a[0]=""}if(a)a[0]=unescape(a[0]);if(!s.getPPVid||s.getPPVid!=pid){s.getPPVid=pid;s.c_w("s_ppv",escape(s.getPPVid));s.handlePPVevents()}if(ist)if(window.addEventListener){window.addEventListener("load",
    s.handlePPVevents,false);window.addEventListener("click",s.handlePPVevents,false);window.addEventListener("scroll",s.handlePPVevents,false);window.addEventListener("resize",s.handlePPVevents,false)}else if(window.attachEvent){window.attachEvent("onload",s.handlePPVevents);window.attachEvent("onclick",s.handlePPVevents);window.attachEvent("onscroll",s.handlePPVevents);window.attachEvent("onresize",s.handlePPVevents)}return pid!="-"?a:a[1]};

    /*
     *	getQueryParam v2.5 - H-code and AppMeasurement Compatible
     */
    s.getQueryParam=new Function("p","d","u","h",""
    +"var s=this,v='',i,j,t;d=d?d:'';u=u?u:(s.pageURL?s.pageURL:(s.wd?s.w"
    +"d.location:window.location));while(p){i=p.indexOf(',');i=i<0?p.leng"
    +"th:i;t=s.p_gpv(p.substring(0,i),u+'',h);if(t){t=t.indexOf('#')>-1?t"
    +".substring(0,t.indexOf('#')):t;}if(t)v+=v?d+t:t;p=p.substring(i==p."
    +"length?i:i+1)}return v");
    s.p_gpv=new Function("k","u","h",""
    +"var s=this,v='',q;j=h==1?'#':'?';i=u.indexOf(j);if(k&&i>-1){q=u.sub"
    +"string(i+1);v=s.pt(q,'&','p_gvf',k)}return v");
    s.p_gvf=new Function("t","k",""
    +"if(t){var s=this,i=t.indexOf('='),p=i<0?t:t.substring(0,i),v=i<0?'T"
    +"rue':t.substring(i+1);if(p.toLowerCase()==k.toLowerCase())return s."
    +"epa?s.epa(v):s.unescape(v);}return''");

    s.getPreviousValue = new Function("v", "c", "el", "" + "var s=this,t=new Date,i,j,r='';t.setTime(t.getTime()+1800000);if(el" + "){if(s.events){i=s.split(el,',');j=s.split(s.events,',');for(x in i" + "){for(y in j){if(i[x]==j[y]){if(s.c_r(c)) r=s.c_r(c);v?s.c_w(c,v,t)" + ":s.c_w(c,'no value',t);return r}}}}}else{if(s.c_r(c)) r=s.c_r(c);v?" + "s.c_w(c,v,t):s.c_w(c,'no value',t);return r}");

    /*
     *	partnerDFACheck v1.1 - for use with DFA Integration.  H-code and AppMeasurement compatible
     */
    s.partnerDFACheck=new Function("cfg",""
    +"var s=this,c=cfg.visitCookie,src=cfg.clickThroughParam,scp=cfg.sear"
    +"chCenterParam,p=cfg.newRsidsProp,tv=cfg.tEvar,dl=',',cr,nc,q,g,gs,i"
    +",j,k,fnd,v=1,t=new Date,cn=0,ca=new Array,aa=new Array,cs=new Array"
    +";t.setTime(t.getTime()+1800000);cr=s.c_r(c);if(cr)v=0;ca=cr.split(d"
    +"l);aa=s.account?s.account.split(dl):s.un.split(dl);for(i=0;i<aa.len"
    +"gth;i++){fnd=0;for(j=0;j<ca.length;j++)if(aa[i]==ca[j])fnd=1;if(!fn"
    +"d){cs[cn]=aa[i];cn++;}}if(cs.length){for(k=0;k<cs.length;k++)nc=(nc"
    +"?nc+dl:'')+cs[k];cr=(cr?cr+dl:'')+nc;s.vpr(p,nc);v=1;}q=window.loca"
    +"tion.search.toLowerCase();q=s.replace?s.replace(q,'?','&'):s.repl(q"
    +",'?','&');g=q.indexOf('&'+src.toLowerCase()+'=');gs=(scp)?q.indexOf"
    +"('&'+scp.toLowerCase()+'='):-1;if(g>-1){s.vpr(p,cr);v=1;}else if(gs"
    +">-1){v=0;s.vpr(tv,'SearchCenter/AMO Visitors');}if(!s.c_w(c,cr,t))s"
    +".c_w(c,cr,0);if(!s.c_r(c))v=0;return v>=1;");
    /*
     * Utility Function: vpr - set the variable vs with value v
     */
    s.vpr=new Function("vs","v",
    "if(typeof(v)!='undefined' && vs){var s=this; eval('s.'+vs+'=\"'+v+'\"')}");

    s.split = new Function("l", "d", "" + "var i,x=0,a=new Array;while(l){i=l.indexOf(d);i=i>-1?i:l.length;a[x++]=l.substring(0,i);l=l.substring(i+d.length);}return a");
    s.repl = new Function("x", "o", "n", "" + "var i=x.indexOf(o),l=n.length;while(x&&i>=0){x=x.substring(0,i)+n+x.substring(i+o.length);i=x.indexOf(o,i+l)}return x");
    s.getValOnce = new Function("v", "c", "e", "" + "var s=this,a=new Date,v=v?v:v='',c=c?c:c='s_gvo',e=e?e:0,k=s.c_r(c" + ");if(v){a.setTime(a.getTime()+e*86400000);s.c_w(c,v,e?a:0);}return" + " v==k?'':v");

    s.p_gh = new Function("", "" + "var s=this;if(!s.eo&&!s.lnk)return'';var o=s.eo?s.eo:s.lnk,y=s.ot(o" + "),n=s.oid(o),x=o.s_oidt;if(s.eo&&o==s.eo){while(o&&!n&&y!='BODY'){o" + "=o.parentElement?o.parentElement:o.parentNode;if(!o)return'';y=s.ot" + "(o);n=s.oid(o);x=o.s_oidt;}}return o?o:'';");
    s.p_gn = new Function("t", "h", "" + "var i=t?t.indexOf('~'):-1,n,x;if(t&&h){n=i<0?'':t.substring(0,i);x=" + "t.substring(i+1);if(h.indexOf(x.toLowerCase())>-1)return n?n:'[[';}" + "return 0;");
    s.getTimeParting = new Function("t", "z", "y", "l", "" + "var s=this,d,A,B,C,D,U,W,X,Y,Z;d=new Date();A=d.getFullYear();if(A=" + "='2011'){B='13';C='06'}if(A=='2012'){B='11';C='04'}if(A=='2013'){B=" + "'10';C='03'}if(A=='2014'){B='09';C='02'}if(A=='2015'){B='08';C='01'" + "}if(A=='2016'){B='13';C='06'}if(A=='2017'){B='12';C='05'}if(!B||!C)" + "{B='08';C='01'}B='03/'+B+'/'+A;C='11/'+C+'/'+A;D=new Date('1/1/2000" + "');if(D.getDay()!=6||D.getMonth()!=0){return'Data Not Available'}el" + "se{z=z?z:'0';z=parseFloat(z);B=new Date(B);C=new Date(C);W=new Date" + "();if(W>B&&W<C&&l!='0'){z=z+1}W=W.getTime()+(W.getTimezoneOffset()*" + "60000);W=new Date(W+(3600000*z));X=['Sunday','Monday','Tuesday','We" + "dnesday','Thursday','Friday','Saturday'];B=W.getHours();C=W.getMinu" + "tes();if(C<10){C='0'+C};D=W.getDay();Z=X[D];U='AM';A='weekday';X='0" + "0';if(C>30){X='30'}if(B>=12){U='PM';B=B-12};if(B==0){B=12};if(D==6|" + "|D==0){A='weekend'}W=B+':'+X+U;if(y&&y!=Y){return'Data Not Availabl" + "e'}else{if(t){if(t=='h'){return W}if(t=='m'){return B+':'+C+' '+U}i" + "f(t=='d'){return Z}if(t=='w'){return A}if(t=='f'){return B+':'+C+' " + "'+U+' - '+Z}}else{return Z+', '+W}}}");
    s.getTimeToComplete = new Function("v", "cn", "e", "" + "var s=this,d=new Date,x=d,k;if(!s.ttcr){e=e?e:0;if(v=='start'||v=='" + "stop')s.ttcr=1;x.setTime(x.getTime()+e*86400000);if(v=='start'){s.c" + "_w(cn,d.getTime(),e?x:0);return '';}if(v=='stop'){k=s.c_r(cn);if(!s" + ".c_w(cn,'',d)||!k)return '';v=(d.getTime()-k)/1000;var td=86400,th=" + "3600,tm=60,r=5,u,un;if(v>td){u=td;un='days';}else if(v>th){u=th;un=" + "'hours';}else if(v>tm){r=2;u=tm;un='minutes';}else{r=.2;u=1;un='sec" + "onds';}v=v*r/u;return (Math.round(v)/r)+' '+un;}}return '';");
    s.screenOrient = {
        cookie: "s_orient",
        defaultVal: "not avaliable",
        delimit: "|",
        first: "",
        last: "",
        ppv: "",
        hasRan: !1
    };
    s.screenOrient.get = function() {
        switch (String(window.orientation)) {
            case "0":
                return "vertical";
                break;
            case "-90":
            case "90":
                return "horizontal";
                break;
            default:
                if (typeof(screen) !== "undefined" && screen.availWidth !== screen.availHeight) {
                    return screen.availWidth > screen.availHeight ? "horizontal" : "vertical"
                } else {
                    if (typeof(screen) !== "undefined" && screen.availWidth === screen.availHeight) {
                        return "square"
                    } else {
                        return s.screenOrient.defaultVal
                    }
                }
        }
    };
    s.screenOrient.debounce = function(f, h, g) {
        var e;
        return function() {
            var b = this,
                a = arguments;
            e ? clearTimeout(e) : g && f.apply(b, a);
            e = setTimeout(function() {
                g || f.apply(b, a);
                e = null
            }, h || 100)
        }
    };
    s.screenOrient.resizeListener = function() {
        try {
            var s = s;
            window.addEventListener ? window.addEventListener("resize", s.screenOrient.setLast, !1) : window.attachEvent && window.attachEvent("onresize", s.screenOrient.setLast, !1)
        } catch (b) {}
    };
    s.screenOrient.init = function() {
        try {
            s.screenOrient.hasRan || (s.screenOrient.last = s.screenOrient.first = s.screenOrient.get(), s.screenOrient.resizeListener(), s.c_w(s.screenOrient.cookie, s.screenOrient.first, 0), s.screenOrient.hasRan = !0)
        } catch (b) {}
    };
    s.screenOrient.getPrevPageValue = function(e, b, a) {
        if (!s.screenOrient.hasRan) {
            s.screenOrient.cookie = e || s.screenOrient.cookie;
            s.screenOrient.defaultVal = a || s.screenOrient.defaultVal;
            s.screenOrient.delimit = b || s.screenOrient.delimit;
            s.screenOrient.ppv = s.c_r(s.screenOrient.cookie) || s.screenOrient.defaultVal;
            s.screenOrient.init()
        }
        return s.screenOrient.ppv
    };
    s.screenOrient.setLast = s.screenOrient.debounce(function() {
        try {
            var s = this,
                e = s.screenOrient.get(),
                d = "";
            if (e !== s.screenOrient.last) {
                s.screenOrient.last = e;
                d = s.screenOrient.first + s.screenOrient.delimit + e;
                s.c_w(s.screenOrient.cookie, d, 0)
            }
        } catch (f) {}
    }, 250);


    /*
    * Cookie Combining Utility v.5
    */
    if(!s.__ccucr)
    {
        s.c_rr = s.c_r;
        s.__ccucr = true;
        function c_r(k)
        {
            var s = this, d = new Date, v = s.c_rr(k), c = s.c_rspers(), i, m, e;
            if(v) return v; k = s.escape ? s.escape(k) : encodeURIComponent(k);
            i = c.indexOf(' ' + k + '='); c = i < 0 ? s.c_rr('s_sess') : c;
            i = c.indexOf(' ' + k + '='); m = i < 0 ? i : c.indexOf('|', i);
            e = i < 0 ? i : c.indexOf(';', i); m = m > 0 ? m : e;
            v = i < 0 ? '' : s.unescape ? s.unescape(c.substring(i + 2 + k.length, m < 0 ? c.length : m)) : decodeURIComponent(c.substring(i + 2 + k.length, m < 0 ? c.length : m));
            return v;
        }
        function c_rspers()
        {
            var s = this, cv = s.c_rr("s_pers"), date = new Date().getTime(), expd = null, cvarr = [], vcv = "";
            if(!cv) return vcv; cvarr = cv.split(";"); for(var i = 0, l = cvarr.length; i < l; i++)    { expd = cvarr[i].match(/\|([0-9]+)$/);
            if(expd && parseInt(expd[1]) >= date) { vcv += cvarr[i] + ";"; } } return vcv;
        }
        s.c_rspers = c_rspers;
        s.c_r = s.cookieRead = c_r;
    }
    if(!s.__ccucw)
    {
        s.c_wr = s.c_w;
        s.__ccucw = true;
        function c_w(k, v, e)
        {
            var s = this, d = new Date, ht = 0, pn = 's_pers', sn = 's_sess', pc = 0, sc = 0, pv, sv, c, i, t, f;
            d.setTime(d.getTime() - 60000); if(s.c_rr(k)) s.c_wr(k, '', d); k = s.escape ? s.escape(k) : encodeURIComponent(k);
            pv = s.c_rspers(); i = pv.indexOf(' ' + k + '='); if(i > -1) { pv = pv.substring(0, i) + pv.substring(pv.indexOf(';', i) + 1); pc = 1; }
            sv = s.c_rr(sn); i = sv.indexOf(' ' + k + '='); if(i > -1) { sv = sv.substring(0, i) + sv.substring(sv.indexOf(';', i) + 1);
            sc = 1; } d = new Date; if(e) { if(e == 1) e = new Date, f = e.getYear(), e.setYear(f + 5 + (f < 1900 ? 1900 : 0));
            if(e.getTime() > d.getTime()) {  pv += ' ' + k + '=' + (s.escape ? s.escape(v) : encodeURIComponent(v)) + '|' + e.getTime() + ';';
            pc = 1; } } else { sv += ' ' + k + '=' + (s.escape ? s.escape(v) : encodeURIComponent(v)) + ';';
            sc = 1; } sv = sv.replace(/%00/g, ''); pv = pv.replace(/%00/g, ''); if(sc) s.c_wr(sn, sv, 0);
            if(pc) { t = pv; while(t && t.indexOf(';') != -1) { var t1 = parseInt(t.substring(t.indexOf('|') + 1, t.indexOf(';')));
            t = t.substring(t.indexOf(';') + 1); ht = ht < t1 ? t1 : ht; } d.setTime(ht); s.c_wr(pn, pv, d); }
            return v == s.c_r(s.unescape ? s.unescape(k) : decodeURIComponent(k));
        }
        s.c_w = s.cookieWrite = c_w;
    }

    s.getPPVCalc = function() {
        return;
    }
    var s_code = '',
        s_objectID;


    /*  DFA  */
    s.maxDelay = dfaConfig.maxDelay;
    s.loadModule("Integrate")
    var dfaIntegrate = function(s,m) {
      if (_neo.cypher.isAdAllowed() ) {
      var dfaCheck = s.partnerDFACheck(dfaConfig);
      if (dfaCheck) {
            s.Integrate.add("DFA");
            s.Integrate.DFA.tEvar = dfaConfig.tEvar;
            s.Integrate.DFA.errorEvar = dfaConfig.errorEvar;
            s.Integrate.DFA.timeoutEvent = dfaConfig.timeoutEvent;
            s.Integrate.DFA.CSID = dfaConfig.CSID;
            s.Integrate.DFA.SPOTID = dfaConfig.SPOTID;
            s.Integrate.DFA.get(dfaConfig.requestURL);
            s.Integrate.DFA.setVars = function(s, p) {
                if (window[p.VAR]) {
                    if (!p.ec) {
                        s[p.tEvar] = "DFA-" + (p.lis ? p.lis : 0) + "-" + (p.lip ? p.lip : 0) + "-" + (p.lastimp ? p.lastimp : 0) + "-" + (p.lastimptime ? p.lastimptime : 0) + "-" + (p.lcs ? p.lcs : 0) + "-" + (p.lcp ? p.lcp : 0) + "-" + (p.lastclk ? p.lastclk : 0) + "-" + (p.lastclktime ? p.lastclktime : 0)
                    } else if (p.errorEvar) {
                        s[p.errorEvar] = p.ec;
                    }
                } else if (p.timeoutEvent) {
                    s.events = ((!s.events || s.events == '') ? '' : (s.events + ',')) + p.timeoutEvent;
                }
            }
        }
      }
    }

    s.Integrate.onLoad= dfaIntegrate(s);

    window.addEventListener('DOMContentLoaded', function(){
      if (typeof nike !== 'undefined' && nike.listen) {
        nike.listen('changeCookieSettingsSuccessEvent', function() {

          if (_neo.cypher.isFPAllowed()) {
            var visitor = Visitor.getInstance("F0935E09512D2C270A490D4D@AdobeOrg", {
              trackingServer: "modus.nike.com", // same as s.trackingServer
              trackingServerSecure: "smodus.nike.com", //same as s.trackingServerSecure

              // To enable CNAME support, add the following configuration variables
              // If you are not using CNAME, DO NOT include these variables
              marketingCloudServer: "modus.nike.com",
              marketingCloudServerSecure: "smodus.nike.com" //same as s.trackingServerSecure
            });
            s.visitor = Visitor.getInstance("F0935E09512D2C270A490D4D@AdobeOrg");
          }

          dfaIntegrate(s);

        });
      }
    })

    /*  Integrate Module  */
    /* Updated per DAT-2304 */
    function AppMeasurement_Module_Integrate(l){var c=this;c.s=l;var e=window;e.s_c_in||(e.s_c_il=[],e.s_c_in=0);c._il=e.s_c_il;c._in=e.s_c_in;c._il[c._in]=c;e.s_c_in++;c._c="s_m";c.list=[];c.add=function(d,b){var a;b||(b="s_Integrate_"+d);e[b]||(e[b]={});a=c[d]=e[b];a.a=d;a.e=c;a._c=0;a._d=0;void 0==a.disable&&(a.disable=0);a.get=function(b,d){var f=document,h=f.getElementsByTagName("HEAD"),k;if(!a.disable&&(d||(v="s_"+c._in+"_Integrate_"+a.a+"_get_"+a._c),a._c++,a.VAR=v,a.CALLBACK="s_c_il["+c._in+"]."+
    a.a+".callback",a.delay(),h=h&&0<h.length?h[0]:f.body))try{k=f.createElement("SCRIPT"),k.type="text/javascript",k.setAttribute("async","async"),k.src=c.c(a,b),0>b.indexOf("[CALLBACK]")&&(k.onload=k.onreadystatechange=function(){a.callback(e[v])}),h.firstChild?h.insertBefore(k,h.firstChild):h.appendChild(k)}catch(l){}};a.callback=function(b){var c;if(b)for(c in b)Object.prototype[c]||(a[c]=b[c]);a.ready()};a.beacon=function(b){var d="s_i_"+c._in+"_Integrate_"+a.a+"_"+a._c;a.disable||(a._c++,d=e[d]=
    new Image,d.src=c.c(a,b))};a.script=function(b){a.get(b,1)};a.delay=function(){a._d++};a.ready=function(){a._d--;a.disable||l.delayReady()};c.list.push(d)};c._g=function(d){var b,a=(d?"use":"set")+"Vars";for(d=0;d<c.list.length;d++)if((b=c[c.list[d]])&&!b.disable&&b[a])try{b[a](l,b)}catch(e){}};c._t=function(){c._g(1)};c._d=function(){var d,b;for(d=0;d<c.list.length;d++)if((b=c[c.list[d]])&&!b.disable&&0<b._d)return 1;return 0};c.c=function(c,b){var a,e,g,f;"http"!=b.toLowerCase().substring(0,4)&&
    (b="http://"+b);l.ssl&&(b=l.replace(b,"http:","https:"));c.RAND=Math.floor(1E13*Math.random());for(a=0;0<=a;)a=b.indexOf("[",a),0<=a&&(e=b.indexOf("]",a),e>a&&(g=b.substring(a+1,e),2<g.length&&"s."==g.substring(0,2)?(f=l[g.substring(2)])||(f=""):(f=""+c[g],f!=c[g]&&parseFloat(f)!=c[g]&&(g=0)),g&&(b=b.substring(0,a)+encodeURIComponent(f)+b.substring(e+1)),a=e));return b}}

    /* Media Module */
    /* Requested as new plugin in DAT-2304 */
    function AppMeasurement_Module_Media(q){var b=this;b.s=q;q=window;q.s_c_in||(q.s_c_il=[],q.s_c_in=0);b._il=q.s_c_il;b._in=q.s_c_in;b._il[b._in]=b;q.s_c_in++;b._c="s_m";b.list=[];b.open=function(d,c,e,k){var f={},a=new Date,l="",g;c||(c=-1);if(d&&e){b.list||(b.list={});b.list[d]&&b.close(d);k&&k.id&&(l=k.id);if(l)for(g in b.list)!Object.prototype[g]&&b.list[g]&&b.list[g].R==l&&b.close(b.list[g].name);f.name=d;f.length=c;f.offset=0;f.e=0;f.playerName=b.playerName?b.playerName:e;f.R=l;f.C=0;f.a=0;f.timestamp=
    Math.floor(a.getTime()/1E3);f.k=0;f.u=f.timestamp;f.c=-1;f.n="";f.g=-1;f.D=0;f.I={};f.G=0;f.m=0;f.f="";f.B=0;f.L=0;f.A=0;f.F=0;f.l=!1;f.v="";f.J="";f.K=0;f.r=!1;f.H="";f.complete=0;f.Q=0;f.p=0;f.q=0;b.list[d]=f}};b.openAd=function(d,c,e,k,f,a,l,g){var h={};b.open(d,c,e,g);if(h=b.list[d])h.l=!0,h.v=k,h.J=f,h.K=a,h.H=l};b.M=function(d){var c=b.list[d];b.list[d]=0;c&&c.monitor&&clearTimeout(c.monitor.interval)};b.close=function(d){b.i(d,0,-1)};b.play=function(d,c,e,k){var f=b.i(d,1,c,e,k);f&&!f.monitor&&
    (f.monitor={},f.monitor.update=function(){1==f.k&&b.i(f.name,3,-1);f.monitor.interval=setTimeout(f.monitor.update,1E3)},f.monitor.update())};b.click=function(d,c){b.i(d,7,c)};b.complete=function(d,c){b.i(d,5,c)};b.stop=function(d,c){b.i(d,2,c)};b.track=function(d){b.i(d,4,-1)};b.P=function(d,c){var e="a.media.",k=d.linkTrackVars,f=d.linkTrackEvents,a="m_i",l,g=d.contextData,h;c.l&&(e+="ad.",c.v&&(g["a.media.name"]=c.v,g[e+"pod"]=c.J,g[e+"podPosition"]=c.K),c.G||(g[e+"CPM"]=c.H));c.r&&(g[e+"clicked"]=
    !0,c.r=!1);g["a.contentType"]="video"+(c.l?"Ad":"");g["a.media.channel"]=b.channel;g[e+"name"]=c.name;g[e+"playerName"]=c.playerName;0<c.length&&(g[e+"length"]=c.length);g[e+"timePlayed"]=Math.floor(c.a);0<Math.floor(c.a)&&(g[e+"timePlayed"]=Math.floor(c.a));c.G||(g[e+"view"]=!0,a="m_s",b.Heartbeat&&b.Heartbeat.enabled&&(a=c.l?b.__primetime?"mspa_s":"msa_s":b.__primetime?"msp_s":"ms_s"),c.G=1);c.f&&(g[e+"segmentNum"]=c.m,g[e+"segment"]=c.f,0<c.B&&(g[e+"segmentLength"]=c.B),c.A&&0<c.a&&(g[e+"segmentView"]=
    !0));!c.Q&&c.complete&&(g[e+"complete"]=!0,c.S=1);0<c.p&&(g[e+"milestone"]=c.p);0<c.q&&(g[e+"offsetMilestone"]=c.q);if(k)for(h in g)Object.prototype[h]||(k+=",contextData."+h);l=g["a.contentType"];d.pe=a;d.pev3=l;var q,s;if(b.contextDataMapping)for(h in d.events2||(d.events2=""),k&&(k+=",events"),b.contextDataMapping)if(!Object.prototype[h]){a=h.length>e.length&&h.substring(0,e.length)==e?h.substring(e.length):"";l=b.contextDataMapping[h];if("string"==typeof l)for(q=l.split(","),s=0;s<q.length;s++)l=
    q[s],"a.contentType"==h?(k&&(k+=","+l),d[l]=g[h]):"view"==a||"segmentView"==a||"clicked"==a||"complete"==a||"timePlayed"==a||"CPM"==a?(f&&(f+=","+l),"timePlayed"==a||"CPM"==a?g[h]&&(d.events2+=(d.events2?",":"")+l+"="+g[h]):g[h]&&(d.events2+=(d.events2?",":"")+l)):"segment"==a&&g[h+"Num"]?(k&&(k+=","+l),d[l]=g[h+"Num"]+":"+g[h]):(k&&(k+=","+l),d[l]=g[h]);else if("milestones"==a||"offsetMilestones"==a)h=h.substring(0,h.length-1),g[h]&&b.contextDataMapping[h+"s"][g[h]]&&(f&&(f+=","+b.contextDataMapping[h+
    "s"][g[h]]),d.events2+=(d.events2?",":"")+b.contextDataMapping[h+"s"][g[h]]);g[h]&&(g[h]=0);"segment"==a&&g[h+"Num"]&&(g[h+"Num"]=0)}d.linkTrackVars=k;d.linkTrackEvents=f};b.i=function(d,c,e,k,f){var a={},l=(new Date).getTime()/1E3,g,h,q=b.trackVars,s=b.trackEvents,t=b.trackSeconds,u=b.trackMilestones,v=b.trackOffsetMilestones,w=b.segmentByMilestones,x=b.segmentByOffsetMilestones,p,n,r=1,m={},y;b.channel||(b.channel=b.s.w.location.hostname);if(a=d&&b.list&&b.list[d]?b.list[d]:0)if(a.l&&(t=b.adTrackSeconds,
    u=b.adTrackMilestones,v=b.adTrackOffsetMilestones,w=b.adSegmentByMilestones,x=b.adSegmentByOffsetMilestones),0>e&&(e=1==a.k&&0<a.u?l-a.u+a.c:a.c),0<a.length&&(e=e<a.length?e:a.length),0>e&&(e=0),a.offset=e,0<a.length&&(a.e=a.offset/a.length*100,a.e=100<a.e?100:a.e),0>a.c&&(a.c=e),y=a.D,m.name=d,m.ad=a.l,m.length=a.length,m.openTime=new Date,m.openTime.setTime(1E3*a.timestamp),m.offset=a.offset,m.percent=a.e,m.playerName=a.playerName,m.mediaEvent=0>a.g?"OPEN":1==c?"PLAY":2==c?"STOP":3==c?"MONITOR":
    4==c?"TRACK":5==c?"COMPLETE":7==c?"CLICK":"CLOSE",2<c||c!=a.k&&(2!=c||1==a.k)){f||(k=a.m,f=a.f);if(c){1==c&&(a.c=e);if((3>=c||5<=c)&&0<=a.g&&(r=!1,q=s="None",a.g!=e)){h=a.g;h>e&&(h=a.c,h>e&&(h=e));p=u?u.split(","):0;if(0<a.length&&p&&e>=h)for(n=0;n<p.length;n++)(g=p[n]?parseFloat(""+p[n]):0)&&h/a.length*100<g&&a.e>=g&&(r=!0,n=p.length,m.mediaEvent="MILESTONE",a.p=m.milestone=g);if((p=v?v.split(","):0)&&e>=h)for(n=0;n<p.length;n++)(g=p[n]?parseFloat(""+p[n]):0)&&h<g&&e>=g&&(r=!0,n=p.length,m.mediaEvent=
    "OFFSET_MILESTONE",a.q=m.offsetMilestone=g)}if(a.L||!f){if(w&&u&&0<a.length){if(p=u.split(","))for(p.push("100"),n=h=0;n<p.length;n++)if(g=p[n]?parseFloat(""+p[n]):0)a.e<g&&(k=n+1,f="M:"+h+"-"+g,n=p.length),h=g}else if(x&&v&&(p=v.split(",")))for(p.push(""+(0<a.length?a.length:"E")),n=h=0;n<p.length;n++)if((g=p[n]?parseFloat(""+p[n]):0)||"E"==p[n]){if(e<g||"E"==p[n])k=n+1,f="O:"+h+"-"+g,n=p.length;h=g}f&&(a.L=!0)}(f||a.f)&&f!=a.f&&(a.F=!0,a.f||(a.m=k,a.f=f),0<=a.g&&(r=!0));(2<=c||100<=a.e)&&a.c<e&&
    (a.C+=e-a.c,a.a+=e-a.c);if(2>=c||3==c&&!a.k)a.n+=(1==c||3==c?"S":"E")+Math.floor(e),a.k=3==c?1:c;!r&&0<=a.g&&3>=c&&(t=t?t:0)&&a.a>=t&&(r=!0,m.mediaEvent="SECONDS");a.u=l;a.c=e}if(!c||3>=c&&100<=a.e)2!=a.k&&(a.n+="E"+Math.floor(e)),c=0,q=s="None",m.mediaEvent="CLOSE";7==c&&(r=m.clicked=a.r=!0);if(5==c||b.completeByCloseOffset&&(!c||100<=a.e)&&0<a.length&&e>=a.length-b.completeCloseOffsetThreshold)r=m.complete=a.complete=!0;l=m.mediaEvent;"MILESTONE"==l?l+="_"+m.milestone:"OFFSET_MILESTONE"==l&&(l+=
    "_"+m.offsetMilestone);a.I[l]?m.eventFirstTime=!1:(m.eventFirstTime=!0,a.I[l]=1);m.event=m.mediaEvent;m.timePlayed=a.C;m.segmentNum=a.m;m.segment=a.f;m.segmentLength=a.B;b.monitor&&4!=c&&b.monitor(b.s,m);b.Heartbeat&&b.Heartbeat.enabled&&0<=a.g&&(r=!1);0==c&&b.M(d);r&&a.D==y&&(d={contextData:{}},d.linkTrackVars=q,d.linkTrackEvents=s,d.linkTrackVars||(d.linkTrackVars=""),d.linkTrackEvents||(d.linkTrackEvents=""),b.P(d,a),d.linkTrackVars||(d["!linkTrackVars"]=1),d.linkTrackEvents||(d["!linkTrackEvents"]=
    1),b.s.track(d),a.F?(a.m=k,a.f=f,a.A=!0,a.F=!1):0<a.a&&(a.A=!1),a.n="",a.p=a.q=0,a.a-=Math.floor(a.a),a.g=e,a.D++)}return a};b.O=function(d,c,e,k,f){var a=0;if(d&&(!b.autoTrackMediaLengthRequired||c&&0<c)){if(b.list&&b.list[d])a=1;else if(1==e||3==e)b.open(d,c,"HTML5 Video",f),a=1;a&&b.i(d,e,k,-1,0)}};b.attach=function(d){var c,e,k;d&&d.tagName&&"VIDEO"==d.tagName.toUpperCase()&&(b.o||(b.o=function(c,a,d){var e,h;b.autoTrack&&(e=c.currentSrc,(h=c.duration)||(h=-1),0>d&&(d=c.currentTime),b.O(e,h,a,
    d,c))}),c=function(){b.o(d,1,-1)},e=function(){b.o(d,1,-1)},b.j(d,"play",c),b.j(d,"pause",e),b.j(d,"seeking",e),b.j(d,"seeked",c),b.j(d,"ended",function(){b.o(d,0,-1)}),b.j(d,"timeupdate",c),k=function(){d.paused||d.ended||d.seeking||b.o(d,3,-1);setTimeout(k,1E3)},k())};b.j=function(b,c,e){b.attachEvent?b.attachEvent("on"+c,e):b.addEventListener&&b.addEventListener(c,e,!1)};void 0==b.completeByCloseOffset&&(b.completeByCloseOffset=1);void 0==b.completeCloseOffsetThreshold&&(b.completeCloseOffsetThreshold=
    1);b.Heartbeat={};b.N=function(){var d,c;if(b.autoTrack&&(d=b.s.d.getElementsByTagName("VIDEO")))for(c=0;c<d.length;c++)b.attach(d[c])};b.j(q,"load",b.N)}

    /* AudienceManagement Module */
    /* Requested as new plugin in DAT-2304 */
    function AppMeasurement_Module_AudienceManagement(d){var a=this;a.s=d;var b=window;b.s_c_in||(b.s_c_il=[],b.s_c_in=0);a._il=b.s_c_il;a._in=b.s_c_in;a._il[a._in]=a;b.s_c_in++;a._c="s_m";a.setup=function(c){b.DIL&&c&&(c.disableDefaultRequest=!0,c.disableScriptAttachment=!0,c.disableCORS=!0,c.secureDataCollection=!1,a.instance=b.DIL.create(c),a.tools=b.DIL.tools)};a.isReady=function(){return a.instance?!0:!1};a.getEventCallConfigParams=function(){return a.instance&&a.instance.api&&a.instance.api.getEventCallConfigParams?
    a.instance.api.getEventCallConfigParams():{}};a.passData=function(b){a.instance&&a.instance.api&&a.instance.api.passData&&a.instance.api.passData(b)}}
    "function"!==typeof window.DIL&&(window.DIL=function(a,c){var e=[],d,g;a!==Object(a)&&(a={});var h,l,t,v,p,n,w,E,r,A,L,B,C,F;h=a.partner;l=a.containerNSID;t=!!a.disableDestinationPublishingIframe;v=a.iframeAkamaiHTTPS;p=a.mappings;n=a.uuidCookie;w=!0===a.enableErrorReporting;E=a.visitorService;r=a.declaredId;A=!0===a.removeFinishedScriptsAndCallbacks;L=!0===a.delayAllUntilWindowLoad;B=!0===a.disableIDSyncs;C="undefined"===typeof a.secureDataCollection||!0===a.secureDataCollection;F=!0===a.useCORSOnly;
    var M,N,I,G,O,P,Q,R;M=!0===a.disableScriptAttachment;N=!0===a.disableDefaultRequest;I=a.afterResultForDefaultRequest;G=a.dpIframeSrc;O=!0===a.testCORS;P=!0===a.useJSONPOnly;Q=a.visitorConstructor;R=!0===a.disableCORS;w&&DIL.errorModule.activate();var T=!0===window._dil_unit_tests;(d=c)&&e.push(d+"");if(!h||"string"!==typeof h)return d="DIL partner is invalid or not specified in initConfig",DIL.errorModule.handleError({name:"error",message:d,filename:"dil.js"}),Error(d);d="DIL containerNSID is invalid or not specified in initConfig, setting to default of 0";
    if(l||"number"===typeof l)l=parseInt(l,10),!isNaN(l)&&0<=l&&(d="");d&&(l=0,e.push(d),d="");g=DIL.getDil(h,l);if(g instanceof DIL&&g.api.getPartner()===h&&g.api.getContainerNSID()===l)return g;if(this instanceof DIL)DIL.registerDil(this,h,l);else return new DIL(a,"DIL was not instantiated with the 'new' operator, returning a valid instance with partner = "+h+" and containerNSID = "+l);var y={IS_HTTPS:C||"https:"===document.location.protocol,POST_MESSAGE_ENABLED:!!window.postMessage,COOKIE_MAX_EXPIRATION_DATE:"Tue, 19 Jan 2038 03:14:07 UTC",
    MILLIS_PER_DAY:864E5,DIL_COOKIE_NAME:"AAMC_"+encodeURIComponent(h)+"_"+l,FIRST_PARTY_SYNCS:"AMSYNCS",FIRST_PARTY_SYNCS_ON_PAGE:"AMSYNCSOP"},J={stuffed:{}},s={},q={firingQueue:[],fired:[],firing:!1,sent:[],errored:[],reservedKeys:{sids:!0,pdata:!0,logdata:!0,callback:!0,postCallbackFn:!0,useImageRequest:!0},callbackPrefix:"demdexRequestCallback",firstRequestHasFired:!1,useJSONP:!0,abortRequests:!1,num_of_jsonp_responses:0,num_of_jsonp_errors:0,num_of_cors_responses:0,num_of_cors_errors:0,corsErrorSources:[],
    num_of_img_responses:0,num_of_img_errors:0,toRemove:[],removed:[],readyToRemove:!1,platformParams:{d_nsid:l+"",d_rtbd:"json",d_jsonv:DIL.jsonVersion+"",d_dst:"1"},nonModStatsParams:{d_rtbd:!0,d_dst:!0,d_cts:!0,d_rs:!0},modStatsParams:null,adms:{TIME_TO_CATCH_ALL_REQUESTS_RELEASE:2E3,calledBack:!1,mid:null,noVisitorAPI:!1,VisitorAPI:null,instance:null,releaseType:"no VisitorAPI",isOptedOut:!0,isOptedOutCallbackCalled:!1,admsProcessingStarted:!1,process:function(b){try{if(!this.admsProcessingStarted){this.admsProcessingStarted=
    !0;var k=this,m,f,a,d;if("function"===typeof b&&"function"===typeof b.getInstance){if(E===Object(E)&&(m=E.namespace)&&"string"===typeof m)f=b.getInstance(m,{idSyncContainerID:l});else{this.releaseType="no namespace";this.releaseRequests();return}if(f===Object(f)&&f instanceof b&&"function"===typeof f.isAllowed&&"function"===typeof f.getMarketingCloudVisitorID&&"function"===typeof f.getCustomerIDs&&"function"===typeof f.isOptedOut){this.VisitorAPI=b;if(!f.isAllowed()){this.releaseType="VisitorAPI not allowed";
    this.releaseRequests();return}this.instance=f;a=function(b){"VisitorAPI"!==k.releaseType&&(k.mid=b,k.releaseType="VisitorAPI",k.releaseRequests())};d=f.getMarketingCloudVisitorID(a);if("string"===typeof d&&d.length){a(d);return}setTimeout(function(){"VisitorAPI"!==k.releaseType&&(k.releaseType="timeout",k.releaseRequests())},this.getLoadTimeout());return}this.releaseType="invalid instance"}else this.noVisitorAPI=!0;this.releaseRequests()}}catch(e){this.releaseRequests()}},releaseRequests:function(){this.calledBack=
    !0;q.registerRequest()},getMarketingCloudVisitorID:function(){return this.instance?this.instance.getMarketingCloudVisitorID():null},getMIDQueryString:function(){var b=x.isPopulatedString,k=this.getMarketingCloudVisitorID();b(this.mid)&&this.mid===k||(this.mid=k);return b(this.mid)?"d_mid="+this.mid+"&":""},getCustomerIDs:function(){return this.instance?this.instance.getCustomerIDs():null},getCustomerIDsQueryString:function(b){if(b===Object(b)){var k="",m=[],f=[],a,d;for(a in b)b.hasOwnProperty(a)&&
    (f[0]=a,d=b[a],d===Object(d)&&(f[1]=d.id||"",f[2]=d.authState||0,m.push(f),f=[]));if(f=m.length)for(b=0;b<f;b++)k+="&d_cid_ic="+u.encodeAndBuildRequest(m[b],"%01");return k}return""},getIsOptedOut:function(){this.instance?this.instance.isOptedOut([this,this.isOptedOutCallback],this.VisitorAPI.OptOut.GLOBAL,!0):(this.isOptedOut=!1,this.isOptedOutCallbackCalled=!0)},isOptedOutCallback:function(b){this.isOptedOut=b;this.isOptedOutCallbackCalled=!0;q.registerRequest()},getLoadTimeout:function(){var b=
    this.instance;if(b){if("function"===typeof b.getLoadTimeout)return b.getLoadTimeout();if("undefined"!==typeof b.loadTimeout)return b.loadTimeout}return this.TIME_TO_CATCH_ALL_REQUESTS_RELEASE}},declaredId:{declaredId:{init:null,request:null},declaredIdCombos:{},setDeclaredId:function(b,k){var m=x.isPopulatedString,f=encodeURIComponent;if(b===Object(b)&&m(k)){var a=b.dpid,d=b.dpuuid,e=null;if(m(a)&&m(d)){e=f(a)+"$"+f(d);if(!0===this.declaredIdCombos[e])return"setDeclaredId: combo exists for type '"+
    k+"'";this.declaredIdCombos[e]=!0;this.declaredId[k]={dpid:a,dpuuid:d};return"setDeclaredId: succeeded for type '"+k+"'"}}return"setDeclaredId: failed for type '"+k+"'"},getDeclaredIdQueryString:function(){var b=this.declaredId.request,k=this.declaredId.init,m=encodeURIComponent,f="";null!==b?f="&d_dpid="+m(b.dpid)+"&d_dpuuid="+m(b.dpuuid):null!==k&&(f="&d_dpid="+m(k.dpid)+"&d_dpuuid="+m(k.dpuuid));return f}},registerRequest:function(b){var k=this.firingQueue;b===Object(b)&&k.push(b);this.firing||
    !k.length||L&&!DIL.windowLoaded||(this.adms.isOptedOutCallbackCalled||this.adms.getIsOptedOut(),this.adms.calledBack&&!this.adms.isOptedOut&&this.adms.isOptedOutCallbackCalled&&(this.adms.isOptedOutCallbackCalled=!1,b=k.shift(),b.src=b.src.replace(/demdex.net\/event\?d_nsid=/,"demdex.net/event?"+this.adms.getMIDQueryString()+"d_nsid="),x.isPopulatedString(b.corsPostData)&&(b.corsPostData=b.corsPostData.replace(/^d_nsid=/,this.adms.getMIDQueryString()+"d_nsid=")),D.fireRequest(b),this.firstRequestHasFired||
    "script"!==b.tag&&"cors"!==b.tag||(this.firstRequestHasFired=!0)))},processVisitorAPI:function(){this.adms.process(Q||window.Visitor)},requestRemoval:function(b){if(!A)return"removeFinishedScriptsAndCallbacks is not boolean true";var k=this.toRemove,m,f;b===Object(b)&&(m=b.script,f=b.callbackName,(m===Object(m)&&"SCRIPT"===m.nodeName||"no script created"===m)&&"string"===typeof f&&f.length&&k.push(b));if(this.readyToRemove&&k.length){f=k.shift();m=f.script;f=f.callbackName;"no script created"!==m?
    (b=m.src,m.parentNode.removeChild(m)):b=m;window[f]=null;try{delete window[f]}catch(a){}this.removed.push({scriptSrc:b,callbackName:f});DIL.variables.scriptsRemoved.push(b);DIL.variables.callbacksRemoved.push(f);return this.requestRemoval()}return"requestRemoval() processed"}};g=function(){var b="http://fast.",k="?d_nsid="+l+"#"+encodeURIComponent(document.location.href);if("string"===typeof G&&G.length)return G+k;y.IS_HTTPS&&(b=!0===v?"https://fast.":"https://");return b+h+".demdex.net/dest5.html"+
    k};var z={THROTTLE_START:3E4,MAX_SYNCS_LENGTH:649,throttleTimerSet:!1,id:"destination_publishing_iframe_"+h+"_"+l,url:g(),onPagePixels:[],iframeHost:null,getIframeHost:function(b){if("string"===typeof b){var k=b.split("/");if(3<=k.length)return k[0]+"//"+k[2];e.push("getIframeHost: url is malformed: "+b);return b}},iframe:null,iframeHasLoaded:!1,sendingMessages:!1,messages:[],messagesPosted:[],messagesReceived:[],messageSendingInterval:y.POST_MESSAGE_ENABLED?15:100,ibsDeleted:[],jsonWaiting:[],jsonProcessed:[],
    canSetThirdPartyCookies:!0,receivedThirdPartyCookiesNotification:!1,newIframeCreated:null,iframeIdChanged:!1,originalIframeHasLoadedAlready:null,attachIframe:function(){function b(){f=document.createElement("iframe");f.sandbox="allow-scripts allow-same-origin";f.title="Adobe ID Syncing iFrame";f.id=m.id;f.style.cssText="display: none; width: 0; height: 0;";f.src=m.url;m.newIframeCreated=!0;k();document.body.appendChild(f)}function k(){u.addListener(f,"load",function(){f.className="aamIframeLoaded";
    m.iframeHasLoaded=!0;m.requestToProcess()})}var m=this,f=document.getElementById(this.id);f?"IFRAME"!==f.nodeName?(this.id+="_2",this.iframeIdChanged=!0,b()):(this.newIframeCreated=!1,"aamIframeLoaded"!==f.className?(this.originalIframeHasLoadedAlready=!1,k()):(this.iframeHasLoaded=this.originalIframeHasLoadedAlready=!0,this.iframe=f,this.requestToProcess())):b();this.iframe=f},requestToProcess:function(b,k){var m=this;b&&!x.isEmptyObject(b)&&this.jsonWaiting.push([b,k]);if((this.receivedThirdPartyCookiesNotification||
    !y.POST_MESSAGE_ENABLED||this.iframeHasLoaded)&&this.jsonWaiting.length){var f=this.jsonWaiting.shift();this.process(f[0],f[1]);this.requestToProcess()}this.iframeHasLoaded&&this.messages.length&&!this.sendingMessages&&(this.throttleTimerSet||(this.throttleTimerSet=!0,setTimeout(function(){m.messageSendingInterval=y.POST_MESSAGE_ENABLED?15:150},this.THROTTLE_START)),this.sendingMessages=!0,this.sendMessages())},processSyncOnPage:function(b){var k,m,f;if((k=b.ibs)&&k instanceof Array&&(m=k.length))for(b=
    0;b<m;b++)f=k[b],f.syncOnPage&&this.checkFirstPartyCookie(f,"","syncOnPage")},process:function(b,k){var m=encodeURIComponent,f,a,d,e,c,h;k===Object(k)&&(h=u.encodeAndBuildRequest(["",k.dpid||"",k.dpuuid||""],","));if((f=b.dests)&&f instanceof Array&&(a=f.length))for(d=0;d<a;d++)e=f[d],c=[m("dests"),m(e.id||""),m(e.y||""),m(e.c||"")],this.addMessage(c.join("|"));if((f=b.ibs)&&f instanceof Array&&(a=f.length))for(d=0;d<a;d++)e=f[d],c=[m("ibs"),m(e.id||""),m(e.tag||""),u.encodeAndBuildRequest(e.url||
    [],","),m(e.ttl||""),"",h,e.fireURLSync?"true":"false"],e.syncOnPage||(this.canSetThirdPartyCookies?this.addMessage(c.join("|")):e.fireURLSync&&this.checkFirstPartyCookie(e,c.join("|")));if((f=b.dpcalls)&&f instanceof Array&&(a=f.length))for(d=0;d<a;d++)e=f[d],c=e.callback||{},c=[c.obj||"",c.fn||"",c.key||"",c.tag||"",c.url||""],c=[m("dpm"),m(e.id||""),m(e.tag||""),u.encodeAndBuildRequest(e.url||[],","),m(e.ttl||""),u.encodeAndBuildRequest(c,","),h],this.addMessage(c.join("|"));this.jsonProcessed.push(b)},
    checkFirstPartyCookie:function(b,k,a){var f=(a="syncOnPage"===a?!0:!1)?y.FIRST_PARTY_SYNCS_ON_PAGE:y.FIRST_PARTY_SYNCS,d=this.getOnPageSyncData(f),e=!1,c=!1,h=Math.ceil((new Date).getTime()/y.MILLIS_PER_DAY);d?(d=d.split("*"),c=this.pruneSyncData(d,b.id,h),e=c.dataPresent,c=c.dataValid,e&&c||this.fireSync(a,b,k,d,f,h)):(d=[],this.fireSync(a,b,k,d,f,h))},getOnPageSyncData:function(b){var k=q.adms.instance;return k&&"function"===typeof k.idSyncGetOnPageSyncInfo?k.idSyncGetOnPageSyncInfo():u.getDilCookieField(b)},
    pruneSyncData:function(b,k,a){var f=!1,d=!1,e,c,h;if(b instanceof Array)for(c=0;c<b.length;c++)e=b[c],h=parseInt(e.split("-")[1],10),e.match("^"+k+"-")?(f=!0,a<h?d=!0:(b.splice(c,1),c--)):a>=h&&(b.splice(c,1),c--);return{dataPresent:f,dataValid:d}},manageSyncsSize:function(b){if(b.join("*").length>this.MAX_SYNCS_LENGTH)for(b.sort(function(b,a){return parseInt(b.split("-")[1],10)-parseInt(a.split("-")[1],10)});b.join("*").length>this.MAX_SYNCS_LENGTH;)b.shift()},fireSync:function(b,k,a,f,d,e){function c(b,
    k,a,f){return function(){h.onPagePixels[b]=null;var m=h.getOnPageSyncData(a),d=[];if(m){var m=m.split("*"),e,c,g;e=0;for(c=m.length;e<c;e++)g=m[e],g.match("^"+k.id+"-")||d.push(g)}h.setSyncTrackingData(d,k,a,f)}}var h=this;if(b){if("img"===k.tag){b=k.url;a=y.IS_HTTPS?"https:":"http:";var g,l,n;f=0;for(g=b.length;f<g;f++){l=b[f];n=/^\/\//.test(l);var r=new Image;u.addListener(r,"load",c(this.onPagePixels.length,k,d,e));r.src=(n?a:"")+l;this.onPagePixels.push(r)}}}else this.addMessage(a),this.setSyncTrackingData(f,
    k,d,e)},addMessage:function(b){var k=encodeURIComponent,k=w?k("---destpub-debug---"):k("---destpub---");this.messages.push(k+b)},setSyncTrackingData:function(b,k,a,f){b.push(k.id+"-"+(f+Math.ceil(k.ttl/60/24)));this.manageSyncsSize(b);u.setDilCookieField(a,b.join("*"))},sendMessages:function(){var b=this,k;this.messages.length?(k=this.messages.shift(),DIL.xd.postMessage(k,this.url,this.iframe.contentWindow),this.messagesPosted.push(k),setTimeout(function(){b.sendMessages()},this.messageSendingInterval)):
    this.sendingMessages=!1},receiveMessage:function(b){var k=/^---destpub-to-parent---/;"string"===typeof b&&k.test(b)&&(k=b.replace(k,"").split("|"),"canSetThirdPartyCookies"===k[0]&&(this.canSetThirdPartyCookies="true"===k[1]?!0:!1,this.receivedThirdPartyCookiesNotification=!0,this.requestToProcess()),this.messagesReceived.push(b))}},K={traits:function(b){x.isValidPdata(b)&&(s.sids instanceof Array||(s.sids=[]),u.extendArray(s.sids,b));return this},pixels:function(b){x.isValidPdata(b)&&(s.pdata instanceof
    Array||(s.pdata=[]),u.extendArray(s.pdata,b));return this},logs:function(b){x.isValidLogdata(b)&&(s.logdata!==Object(s.logdata)&&(s.logdata={}),u.extendObject(s.logdata,b));return this},customQueryParams:function(b){x.isEmptyObject(b)||u.extendObject(s,b,q.reservedKeys);return this},signals:function(b,k){var a,f=b;if(!x.isEmptyObject(f)){if(k&&"string"===typeof k)for(a in f={},b)b.hasOwnProperty(a)&&(f[k+a]=b[a]);u.extendObject(s,f,q.reservedKeys)}return this},declaredId:function(b){q.declaredId.setDeclaredId(b,
    "request");return this},result:function(b){"function"===typeof b&&(s.callback=b);return this},afterResult:function(b){"function"===typeof b&&(s.postCallbackFn=b);return this},useImageRequest:function(){s.useImageRequest=!0;return this},clearData:function(){s={};return this},submit:function(){D.submitRequest(s);s={};return this},getPartner:function(){return h},getContainerNSID:function(){return l},getEventLog:function(){return e},getState:function(){var b={},k={};u.extendObject(b,q,{callbackPrefix:!0,
    useJSONP:!0,registerRequest:!0});u.extendObject(k,z,{attachIframe:!0,requestToProcess:!0,process:!0,sendMessages:!0});return{initConfig:a,pendingRequest:s,otherRequestInfo:b,destinationPublishingInfo:k}},idSync:function(b){if(B)return"Error: id syncs have been disabled";if(b!==Object(b)||"string"!==typeof b.dpid||!b.dpid.length)return"Error: config or config.dpid is empty";if("string"!==typeof b.url||!b.url.length)return"Error: config.url is empty";var k=b.url,a=b.minutesToLive,f=encodeURIComponent,
    d,k=k.replace(/^https:/,"").replace(/^http:/,"");if("undefined"===typeof a)a=20160;else if(a=parseInt(a,10),isNaN(a)||0>=a)return"Error: config.minutesToLive needs to be a positive number";d=u.encodeAndBuildRequest(["",b.dpid,b.dpuuid||""],",");b=["ibs",f(b.dpid),"img",f(k),a,"",d];z.addMessage(b.join("|"));q.firstRequestHasFired&&z.requestToProcess();return"Successfully queued"},aamIdSync:function(b){if(B)return"Error: id syncs have been disabled";if(b!==Object(b)||"string"!==typeof b.dpuuid||!b.dpuuid.length)return"Error: config or config.dpuuid is empty";
    b.url="//dpm.demdex.net/ibs:dpid="+b.dpid+"&dpuuid="+b.dpuuid;return this.idSync(b)},passData:function(b){if(x.isEmptyObject(b))return"Error: json is empty or not an object";z.ibsDeleted.push(b.ibs);delete b.ibs;D.defaultCallback(b);return b},getPlatformParams:function(){return q.platformParams},getEventCallConfigParams:function(){var b=q,k=b.modStatsParams,a=b.platformParams,f;if(!k){k={};for(f in a)a.hasOwnProperty(f)&&!b.nonModStatsParams[f]&&(k[f.replace(/^d_/,"")]=a[f]);b.modStatsParams=k}return k}},
    D={corsMetadata:function(){var b="none",a=!0;"undefined"!==typeof XMLHttpRequest&&XMLHttpRequest===Object(XMLHttpRequest)&&("withCredentials"in new XMLHttpRequest?b="XMLHttpRequest":(new Function("/*@cc_on return /^10/.test(@_jscript_version) @*/"))()?b="XMLHttpRequest":"undefined"!==typeof XDomainRequest&&XDomainRequest===Object(XDomainRequest)&&(a=!1),0<Object.prototype.toString.call(window.HTMLElement).indexOf("Constructor")&&(a=!1));return{corsType:b,corsCookiesEnabled:a}}(),getCORSInstance:function(){return"none"===
    this.corsMetadata.corsType?null:new window[this.corsMetadata.corsType]},submitRequest:function(b){q.registerRequest(D.createQueuedRequest(b));return!0},createQueuedRequest:function(b){var a=q,d,f=b.callback,e="img",c;if(!x.isEmptyObject(p)){var h,g,n;for(h in p)p.hasOwnProperty(h)&&(g=p[h],null!=g&&""!==g&&h in b&&!(g in b||g in q.reservedKeys)&&(n=b[h],null!=n&&""!==n&&(b[g]=n)))}x.isValidPdata(b.sids)||(b.sids=[]);x.isValidPdata(b.pdata)||(b.pdata=[]);x.isValidLogdata(b.logdata)||(b.logdata={});
    b.logdataArray=u.convertObjectToKeyValuePairs(b.logdata,"=",!0);b.logdataArray.push("_ts="+(new Date).getTime());"function"!==typeof f&&(f=this.defaultCallback);a.useJSONP=!0!==b.useImageRequest;a.useJSONP&&(e="script",d=a.callbackPrefix+"_"+l+"_"+(new Date).getTime());a=this.makeRequestSrcData(b,d);P&&!F||!(c=this.getCORSInstance())||(e="cors");return{tag:e,src:a.src,corsSrc:a.corsSrc,internalCallbackName:d,callbackFn:f,postCallbackFn:b.postCallbackFn,useImageRequest:!!b.useImageRequest,requestData:b,
    corsInstance:c,corsPostData:a.corsPostData}},defaultCallback:function(b,a){z.processSyncOnPage(b);var d,f,e,c,h,g,l,r,w;if((d=b.stuff)&&d instanceof Array&&(f=d.length))for(e=0;e<f;e++)if((c=d[e])&&c===Object(c)){h=c.cn;g=c.cv;l=c.ttl;if("undefined"===typeof l||""===l)l=Math.floor(u.getMaxCookieExpiresInMinutes()/60/24);r=c.dmn||"."+document.domain.replace(/^www\./,"");w=c.type;h&&(g||"number"===typeof g)&&("var"!==w&&(l=parseInt(l,10))&&!isNaN(l)&&u.setCookie(h,g,1440*l,"/",r,!1),J.stuffed[h]=g)}d=
    b.uuid;x.isPopulatedString(d)&&!x.isEmptyObject(n)&&(f=n.path,"string"===typeof f&&f.length||(f="/"),e=parseInt(n.days,10),isNaN(e)&&(e=100),u.setCookie(n.name||"aam_did",d,1440*e,f,n.domain||"."+document.domain.replace(/^www\./,""),!0===n.secure));t||q.abortRequests||z.requestToProcess(b,a)},makeRequestSrcData:function(b,a){b.sids=x.removeEmptyArrayValues(b.sids||[]);b.pdata=x.removeEmptyArrayValues(b.pdata||[]);var d=q,f=d.platformParams,e=u.encodeAndBuildRequest(b.sids,","),c=u.encodeAndBuildRequest(b.pdata,
    ","),g=(b.logdataArray||[]).join("&");delete b.logdataArray;var n=y.IS_HTTPS?"https://":"http://",r=d.declaredId.getDeclaredIdQueryString(),w=d.adms.instance?d.adms.getCustomerIDsQueryString(d.adms.getCustomerIDs()):"",p;p=[];var s,t,v,A;for(s in b)if(!(s in d.reservedKeys)&&b.hasOwnProperty(s))if(t=b[s],s=encodeURIComponent(s),t instanceof Array)for(v=0,A=t.length;v<A;v++)p.push(s+"="+encodeURIComponent(t[v]));else p.push(s+"="+encodeURIComponent(t));p=p.length?"&"+p.join("&"):"";e="d_nsid="+f.d_nsid+
    r+w+(e.length?"&d_sid="+e:"")+(c.length?"&d_px="+c:"")+(g.length?"&d_ld="+encodeURIComponent(g):"");f="&d_rtbd="+f.d_rtbd+"&d_jsonv="+f.d_jsonv+"&d_dst="+f.d_dst;n=n+h+".demdex.net/event";c=d=n+"?"+e+(d.useJSONP?f+"&d_cb="+(a||""):"")+p;2048<d.length&&(d=d.substring(0,2048).substring(0,d.lastIndexOf("&")));return{corsSrc:n+"?"+(O?"testcors=1&d_nsid="+l+"&":"")+"_ts="+(new Date).getTime(),src:d,originalSrc:c,corsPostData:e+f+p,isDeclaredIdCall:""!==r}},fireRequest:function(b){if("img"===b.tag)this.fireImage(b);
    else{var a=q.declaredId,a=a.declaredId.request||a.declaredId.init||{},a={dpid:a.dpid||"",dpuuid:a.dpuuid||""};"script"===b.tag?this.fireScript(b,a):"cors"===b.tag&&this.fireCORS(b,a)}},fireImage:function(b){var a=q,c,f;a.abortRequests||(a.firing=!0,c=new Image(0,0),a.sent.push(b),c.onload=function(){a.firing=!1;a.fired.push(b);a.num_of_img_responses++;a.registerRequest()},f=function(f){d="imgAbortOrErrorHandler received the event of type "+f.type;e.push(d);a.abortRequests=!0;a.firing=!1;a.errored.push(b);
    a.num_of_img_errors++;a.registerRequest()},c.addEventListener?(c.addEventListener("error",f,!1),c.addEventListener("abort",f,!1)):c.attachEvent&&(c.attachEvent("onerror",f),c.attachEvent("onabort",f)),c.src=b.src)},fireScript:function(b,a){var c=this,f=q,g,l,n=b.src,r=b.postCallbackFn,w="function"===typeof r,p=b.internalCallbackName;f.abortRequests||(f.firing=!0,window[p]=function(c){try{c!==Object(c)&&(c={});B&&(z.ibsDeleted.push(c.ibs),delete c.ibs);var m=b.callbackFn;f.firing=!1;f.fired.push(b);
    f.num_of_jsonp_responses++;m(c,a);w&&r(c,a)}catch(g){g.message="DIL jsonp callback caught error with message "+g.message;d=g.message;e.push(d);g.filename=g.filename||"dil.js";g.partner=h;DIL.errorModule.handleError(g);try{m({error:g.name+"|"+g.message},a),w&&r({error:g.name+"|"+g.message},a)}catch(n){}}finally{f.requestRemoval({script:l,callbackName:p}),f.registerRequest()}},M||F?(f.firing=!1,f.requestRemoval({script:"no script created",callbackName:p})):(l=document.createElement("script"),l.addEventListener&&
    l.addEventListener("error",function(a){f.requestRemoval({script:l,callbackName:p});d="jsonp script tag error listener received the event of type "+a.type+" with src "+n;c.handleScriptError(d,b)},!1),l.type="text/javascript",l.src=n,g=DIL.variables.scriptNodeList[0],g.parentNode.insertBefore(l,g)),f.sent.push(b),f.declaredId.declaredId.request=null)},fireCORS:function(b,a){var c=this,f=q,g=this.corsMetadata.corsType,l=b.corsSrc,n=b.corsInstance,r=b.corsPostData,p=b.postCallbackFn,w="function"===typeof p;
    if(!f.abortRequests&&!R){f.firing=!0;try{n.open("post",l,!0),"XMLHttpRequest"===g&&(n.withCredentials=!0,n.setRequestHeader("Content-Type","application/x-www-form-urlencoded"),n.onreadystatechange=function(){if(4===this.readyState&&200===this.status)a:{var g;try{if(g=JSON.parse(this.responseText),g!==Object(g)){c.handleCORSError(b,a,"Response is not JSON");break a}}catch(l){c.handleCORSError(b,a,"Error parsing response as JSON");break a}B&&(z.ibsDeleted.push(g.ibs),delete g.ibs);try{var n=b.callbackFn;
    f.firing=!1;f.fired.push(b);f.num_of_cors_responses++;n(g,a);w&&p(g,a)}catch(r){r.message="DIL handleCORSResponse caught error with message "+r.message;d=r.message;e.push(d);r.filename=r.filename||"dil.js";r.partner=h;DIL.errorModule.handleError(r);try{n({error:r.name+"|"+r.message},a),w&&p({error:r.name+"|"+r.message},a)}catch(V){}}finally{f.registerRequest()}}}),n.onerror=function(){c.handleCORSError(b,a,"onerror")},n.ontimeout=function(){c.handleCORSError(b,a,"ontimeout")},n.send(r)}catch(s){this.handleCORSError(b,
    a,"try-catch")}f.sent.push(b);f.declaredId.declaredId.request=null}},handleCORSError:function(b,a,c){q.num_of_cors_errors++;q.corsErrorSources.push(c);"ontimeout"===c||F||(b.tag="script",this.fireScript(b,a))},handleScriptError:function(b,a){q.num_of_jsonp_errors++;this.handleRequestError(b,a)},handleRequestError:function(b,a){var c=q;e.push(b);c.abortRequests=!0;c.firing=!1;c.errored.push(a);c.registerRequest()}},x={isValidPdata:function(b){return b instanceof Array&&this.removeEmptyArrayValues(b).length?
    !0:!1},isValidLogdata:function(b){return!this.isEmptyObject(b)},isEmptyObject:function(b){if(b!==Object(b))return!0;for(var a in b)if(b.hasOwnProperty(a))return!1;return!0},removeEmptyArrayValues:function(b){for(var a=0,c=b.length,f,d=[],a=0;a<c;a++)f=b[a],"undefined"!==typeof f&&null!==f&&""!==f&&d.push(f);return d},isPopulatedString:function(b){return"string"===typeof b&&b.length}},u={addListener:function(){if(document.addEventListener)return function(b,a,c){b.addEventListener(a,function(b){"function"===
    typeof c&&c(b)},!1)};if(document.attachEvent)return function(b,a,c){b.attachEvent("on"+a,function(b){"function"===typeof c&&c(b)})}}(),convertObjectToKeyValuePairs:function(b,a,c){var f=[],d,e;a||(a="=");for(d in b)b.hasOwnProperty(d)&&(e=b[d],"undefined"!==typeof e&&null!==e&&""!==e&&f.push(d+a+(c?encodeURIComponent(e):e)));return f},encodeAndBuildRequest:function(b,a){return this.map(b,function(b){return encodeURIComponent(b)}).join(a)},map:function(b,a){if(Array.prototype.map)return b.map(a);if(void 0===
    b||null===b)throw new TypeError;var c=Object(b),d=c.length>>>0;if("function"!==typeof a)throw new TypeError;for(var e=Array(d),g=0;g<d;g++)g in c&&(e[g]=a.call(a,c[g],g,c));return e},filter:function(b,a){if(!Array.prototype.filter){if(void 0===b||null===b)throw new TypeError;var c=Object(b),d=c.length>>>0;if("function"!==typeof a)throw new TypeError;for(var e=[],g=0;g<d;g++)if(g in c){var h=c[g];a.call(a,h,g,c)&&e.push(h)}return e}return b.filter(a)},getCookie:function(b){b+="=";var a=document.cookie.split(";"),
    c,d,e;c=0;for(d=a.length;c<d;c++){for(e=a[c];" "===e.charAt(0);)e=e.substring(1,e.length);if(0===e.indexOf(b))return decodeURIComponent(e.substring(b.length,e.length))}return null},setCookie:function(b,a,c,d,e,g){var h=new Date;c&&(c*=6E4);document.cookie=b+"="+encodeURIComponent(a)+(c?";expires="+(new Date(h.getTime()+c)).toUTCString():"")+(d?";path="+d:"")+(e?";domain="+e:"")+(g?";secure":"")},extendArray:function(b,a){return b instanceof Array&&a instanceof Array?(Array.prototype.push.apply(b,
    a),!0):!1},extendObject:function(b,a,c){var d;if(b===Object(b)&&a===Object(a)){for(d in a)!a.hasOwnProperty(d)||!x.isEmptyObject(c)&&d in c||(b[d]=a[d]);return!0}return!1},getMaxCookieExpiresInMinutes:function(){return((new Date(y.COOKIE_MAX_EXPIRATION_DATE)).getTime()-(new Date).getTime())/1E3/60},getCookieField:function(b,a){var c=this.getCookie(b),d=decodeURIComponent;if("string"===typeof c){var c=c.split("|"),e,g;e=0;for(g=c.length-1;e<g;e++)if(d(c[e])===a)return d(c[e+1])}return null},getDilCookieField:function(b){return this.getCookieField(y.DIL_COOKIE_NAME,
    b)},setCookieField:function(b,a,c){var d=this.getCookie(b),e=!1,g=encodeURIComponent;a=g(a);c=g(c);if("string"===typeof d){var d=d.split("|"),h,g=0;for(h=d.length-1;g<h;g++)if(d[g]===a){d[g+1]=c;e=!0;break}e||(g=d.length,d[g]=a,d[g+1]=c)}else d=[a,c];this.setCookie(b,d.join("|"),this.getMaxCookieExpiresInMinutes(),"/",this.getDomain(),!1)},setDilCookieField:function(b,a){return this.setCookieField(y.DIL_COOKIE_NAME,b,a)},getDomain:function(b){!b&&window.location&&(b=window.location.hostname);if(b)if(/^[0-9.]+$/.test(b))b=
    "";else{var a=b.split("."),c=a.length-1,d=c-1;1<c&&2>=a[c].length&&(2===a[c-1].length||0>",DOMAIN_2_CHAR_EXCEPTIONS,".indexOf(","+a[c]+","))&&d--;if(0<d)for(b="";c>=d;)b=a[c]+(b?".":"")+b,c--}return b}};"error"===h&&0===l&&u.addListener(window,"load",function(){DIL.windowLoaded=!0});var S=!1,H=function(){S||(S=!0,q.registerRequest(),U(),t||q.abortRequests||z.attachIframe(),q.readyToRemove=!0,q.requestRemoval())},U=function(){t||setTimeout(function(){N||q.firstRequestHasFired||("function"===typeof I?
    K.afterResult(I).submit():K.submit())},DIL.constants.TIME_TO_DEFAULT_REQUEST)};C=document;"error"!==h&&(DIL.windowLoaded?H():"complete"!==C.readyState&&"loaded"!==C.readyState?u.addListener(window,"load",function(){DIL.windowLoaded=!0;H()}):(DIL.windowLoaded=!0,H()));if("error"!==h)try{DIL.xd.receiveMessage(function(b){z.receiveMessage(b.data)},z.getIframeHost(z.url))}catch(W){}q.declaredId.setDeclaredId(r,"init");q.processVisitorAPI();this.api=K;this.getStuffedVariable=function(b){var a=J.stuffed[b];
    a||"number"===typeof a||(a=u.getCookie(b))||"number"===typeof a||(a="");return a};this.validators=x;this.helpers=u;this.constants=y;this.log=e;T&&(this.pendingRequest=s,this.requestController=q,this.setDestinationPublishingUrl=g,this.destinationPublishing=z,this.requestProcs=D,this.variables=J,this.callWindowLoadFunctions=H)},function(){var a=document,c;null==a.readyState&&a.addEventListener&&(a.readyState="loading",a.addEventListener("DOMContentLoaded",c=function(){a.removeEventListener("DOMContentLoaded",
    c,!1);a.readyState="complete"},!1))}(),DIL.extendStaticPropertiesAndMethods=function(a){var c;if(a===Object(a))for(c in a)a.hasOwnProperty(c)&&(this[c]=a[c])},DIL.extendStaticPropertiesAndMethods({version:"6.6",jsonVersion:1,constants:{TIME_TO_DEFAULT_REQUEST:50},variables:{scriptNodeList:document.getElementsByTagName("script"),scriptsRemoved:[],callbacksRemoved:[]},windowLoaded:!1,dils:{},isAddedPostWindowLoad:function(a){this.windowLoaded="function"===typeof a?!!a():"boolean"===typeof a?a:!0},create:function(a){try{return new DIL(a)}catch(c){return(new Image(0,
    0)).src="http://error.demdex.net/event?d_nsid=0&d_px=14137&d_ld=name%3Derror%26filename%3Ddil.js%26partner%3Dno_partner%26message%3DError%2520in%2520attempt%2520to%2520create%2520DIL%2520instance%2520with%2520DIL.create()%26_ts%3D"+(new Date).getTime(),Error("Error in attempt to create DIL instance with DIL.create()")}},registerDil:function(a,c,e){c=c+"$"+e;c in this.dils||(this.dils[c]=a)},getDil:function(a,c){var e;"string"!==typeof a&&(a="");c||(c=0);e=a+"$"+c;return e in this.dils?this.dils[e]:
    Error("The DIL instance with partner = "+a+" and containerNSID = "+c+" was not found")},dexGetQSVars:function(a,c,e){c=this.getDil(c,e);return c instanceof this?c.getStuffedVariable(a):""},xd:{postMessage:function(a,c,e){var d=1;c&&(window.postMessage?e.postMessage(a,c.replace(/([^:]+:\/\/[^\/]+).*/,"$1")):c&&(e.location=c.replace(/#.*$/,"")+"#"+ +new Date+d++ +"&"+a))},receiveMessage:function(a,c){var e;try{if(window.postMessage)if(a&&(e=function(d){if("string"===typeof c&&d.origin!==c||"[object Function]"===
    Object.prototype.toString.call(c)&&!1===c(d.origin))return!1;a(d)}),window.addEventListener)window[a?"addEventListener":"removeEventListener"]("message",e,!1);else window[a?"attachEvent":"detachEvent"]("onmessage",e)}catch(d){}}}}),DIL.errorModule=function(){var a=DIL.create({partner:"error",containerNSID:0,disableDestinationPublishingIframe:!0}),c={harvestererror:14138,destpuberror:14139,dpmerror:14140,generalerror:14137,error:14137,noerrortypedefined:15021,evalerror:15016,rangeerror:15017,referenceerror:15018,
    typeerror:15019,urierror:15020},e=!1;return{activate:function(){e=!0},handleError:function(d){if(!e)return"DIL error module has not been activated";d!==Object(d)&&(d={});var g=d.name?(d.name+"").toLowerCase():"",h=[];d={name:g,filename:d.filename?d.filename+"":"",partner:d.partner?d.partner+"":"no_partner",site:d.site?d.site+"":document.location.href,message:d.message?d.message+"":""};h.push(g in c?c[g]:c.noerrortypedefined);a.api.pixels(h).logs(d).useImageRequest().submit();return"DIL error report sent"},
    pixelMap:c}}(),DIL.tools={},DIL.modules={helpers:{handleModuleError:function(a,c,e){var d="";c=c||"Error caught in DIL module/submodule: ";a===Object(a)?d=c+(a.message||"err has no message"):(d=c+"err is not a valid object",a={});a.message=d;e instanceof DIL&&(a.partner=e.api.getPartner());DIL.errorModule.handleError(a);return this.errorMessage=d}}});
    DIL.tools.getSearchReferrer=function(a,c){var e=DIL.getDil("error"),d=DIL.tools.decomposeURI(a||document.referrer),g="",h="",l={queryParam:"q"};return(g=e.helpers.filter([c===Object(c)?c:{},{hostPattern:/aol\./},{hostPattern:/ask\./},{hostPattern:/bing\./},{hostPattern:/google\./},{hostPattern:/yahoo\./,queryParam:"p"}],function(a){return!(!a.hasOwnProperty("hostPattern")||!d.hostname.match(a.hostPattern))}).shift())?{valid:!0,name:d.hostname,keywords:(e.helpers.extendObject(l,g),h=l.queryPattern?
    (g=(""+d.search).match(l.queryPattern))?g[1]:"":d.uriParams[l.queryParam],decodeURIComponent(h||"").replace(/\+|%20/g," "))}:{valid:!1,name:"",keywords:""}};
    DIL.tools.decomposeURI=function(a){var c=DIL.getDil("error"),e=document.createElement("a");e.href=a||document.referrer;return{hash:e.hash,host:e.host.split(":").shift(),hostname:e.hostname,href:e.href,pathname:e.pathname.replace(/^\//,""),protocol:e.protocol,search:e.search,uriParams:function(a,e){c.helpers.map(e.split("&"),function(c){c=c.split("=");a[c.shift()]=c.shift()});return a}({},e.search.replace(/^(\/|\?)?|\/$/g,""))}};
    DIL.tools.getMetaTags=function(){var a={},c=document.getElementsByTagName("meta"),e,d,g,h,l;e=0;for(g=arguments.length;e<g;e++)if(h=arguments[e],null!==h)for(d=0;d<c.length;d++)if(l=c[d],l.name===h){a[h]=l.content;break}return a};
    DIL.modules.siteCatalyst={dil:null,handle:DIL.modules.helpers.handleModuleError,init:function(a,c,e,d){try{var g=this,h={name:"DIL Site Catalyst Module Error"},l=function(a){h.message=a;DIL.errorModule.handleError(h);return a};this.options=d===Object(d)?d:{};this.dil=null;if(c instanceof DIL)this.dil=c;else return l("dilInstance is not a valid instance of DIL");h.partner=c.api.getPartner();if(a!==Object(a))return l("siteCatalystReportingSuite is not an object");window.AppMeasurement_Module_DIL=a.m_DIL=
    function(a){var c="function"===typeof a.m_i?a.m_i("DIL"):this;if(c!==Object(c))return l("m is not an object");c.trackVars=g.constructTrackVars(e);c.d=0;c.s=a;c._t=function(){var a,c,d=","+this.trackVars+",",e=this.s,h,p=[];h=[];var t={},v=!1;if(e!==Object(e))return l("Error in m._t function: s is not an object");if(this.d){if("function"===typeof e.foreachVar)e.foreachVar(function(a,c){"undefined"!==typeof c&&(t[a]=c,v=!0)},this.trackVars);else{if(!(e.va_t instanceof Array))return l("Error in m._t function: s.va_t is not an array");
    if(e.lightProfileID)(a=e.lightTrackVars)&&(a=","+a+","+e.vl_mr+",");else if(e.pe||e.linkType)a=e.linkTrackVars,e.pe&&(c=e.pe.substring(0,1).toUpperCase()+e.pe.substring(1),e[c]&&(a=e[c].trackVars)),a&&(a=","+a+","+e.vl_l+","+e.vl_l2+",");if(a){c=0;for(p=a.split(",");c<p.length;c++)0<=d.indexOf(","+p[c]+",")&&h.push(p[c]);h.length&&(d=","+h.join(",")+",")}h=0;for(c=e.va_t.length;h<c;h++)a=e.va_t[h],0<=d.indexOf(","+a+",")&&"undefined"!==typeof e[a]&&null!==e[a]&&""!==e[a]&&(t[a]=e[a],v=!0)}g.includeContextData(e,
    t).store_populated&&(v=!0);v&&this.d.api.signals(t,"c_").submit()}}};a.loadModule("DIL");a.DIL.d=c;return h.message?h.message:"DIL.modules.siteCatalyst.init() completed with no errors"}catch(t){return this.handle(t,"DIL.modules.siteCatalyst.init() caught error with message ",this.dil)}},constructTrackVars:function(a){var c=[],e,d,g,h,l;if(a===Object(a)){e=a.names;if(e instanceof Array&&(g=e.length))for(d=0;d<g;d++)h=e[d],"string"===typeof h&&h.length&&c.push(h);a=a.iteratedNames;if(a instanceof Array&&
    (g=a.length))for(d=0;d<g;d++)if(e=a[d],e===Object(e)&&(h=e.name,l=parseInt(e.maxIndex,10),"string"===typeof h&&h.length&&!isNaN(l)&&0<=l))for(e=0;e<=l;e++)c.push(h+e);if(c.length)return c.join(",")}return this.constructTrackVars({names:"pageName channel campaign products events pe pev1 pev2 pev3".split(" "),iteratedNames:[{name:"prop",maxIndex:75},{name:"eVar",maxIndex:250}]})},includeContextData:function(a,c){var e={},d=!1;if(a.contextData===Object(a.contextData)){var g=a.contextData,h=this.options.replaceContextDataPeriodsWith,
    l=this.options.filterFromContextVariables,t={},v,p,n,w;"string"===typeof h&&h.length||(h="_");if(l instanceof Array)for(v=0,p=l.length;v<p;v++)n=l[v],this.dil.validators.isPopulatedString(n)&&(t[n]=!0);for(w in g)!g.hasOwnProperty(w)||t[w]||!(l=g[w])&&"number"!==typeof l||(w=("contextData."+w).replace(/\./g,h),c[w]=l,d=!0)}e.store_populated=d;return e}};
    DIL.modules.GA={dil:null,arr:null,tv:null,errorMessage:"",defaultTrackVars:["_setAccount","_setCustomVar","_addItem","_addTrans","_trackSocial"],defaultTrackVarsObj:null,signals:{},hasSignals:!1,handle:DIL.modules.helpers.handleModuleError,init:function(a,c,e){try{this.tv=this.arr=this.dil=null;this.errorMessage="";this.signals={};this.hasSignals=!1;var d={name:"DIL GA Module Error"},g="";c instanceof DIL?(this.dil=c,d.partner=this.dil.api.getPartner()):(g="dilInstance is not a valid instance of DIL",
    d.message=g,DIL.errorModule.handleError(d));a instanceof Array&&a.length?this.arr=a:(g="gaArray is not an array or is empty",d.message=g,DIL.errorModule.handleError(d));this.tv=this.constructTrackVars(e);this.errorMessage=g}catch(h){this.handle(h,"DIL.modules.GA.init() caught error with message ",this.dil)}finally{return this}},constructTrackVars:function(a){var c=[],e,d,g,h;if(this.defaultTrackVarsObj!==Object(this.defaultTrackVarsObj)){g=this.defaultTrackVars;h={};e=0;for(d=g.length;e<d;e++)h[g[e]]=
    !0;this.defaultTrackVarsObj=h}else h=this.defaultTrackVarsObj;if(a===Object(a)){a=a.names;if(a instanceof Array&&(d=a.length))for(e=0;e<d;e++)g=a[e],"string"===typeof g&&g.length&&g in h&&c.push(g);if(c.length)return c}return this.defaultTrackVars},constructGAObj:function(a){var c={};a=a instanceof Array?a:this.arr;var e,d,g,h;e=0;for(d=a.length;e<d;e++)g=a[e],g instanceof Array&&g.length&&(g=[],h=a[e],g instanceof Array&&h instanceof Array&&Array.prototype.push.apply(g,h),h=g.shift(),"string"===
    typeof h&&h.length&&(c[h]instanceof Array||(c[h]=[]),c[h].push(g)));return c},addToSignals:function(a,c){if("string"!==typeof a||""===a||null==c||""===c)return!1;this.signals[a]instanceof Array||(this.signals[a]=[]);this.signals[a].push(c);return this.hasSignals=!0},constructSignals:function(){var a=this.constructGAObj(),c={_setAccount:function(a){this.addToSignals("c_accountId",a)},_setCustomVar:function(a,c,d){"string"===typeof c&&c.length&&this.addToSignals("c_"+c,d)},_addItem:function(a,c,d,e,
    g,h){this.addToSignals("c_itemOrderId",a);this.addToSignals("c_itemSku",c);this.addToSignals("c_itemName",d);this.addToSignals("c_itemCategory",e);this.addToSignals("c_itemPrice",g);this.addToSignals("c_itemQuantity",h)},_addTrans:function(a,c,d,e,g,h,l,t){this.addToSignals("c_transOrderId",a);this.addToSignals("c_transAffiliation",c);this.addToSignals("c_transTotal",d);this.addToSignals("c_transTax",e);this.addToSignals("c_transShipping",g);this.addToSignals("c_transCity",h);this.addToSignals("c_transState",
    l);this.addToSignals("c_transCountry",t)},_trackSocial:function(a,c,d,e){this.addToSignals("c_socialNetwork",a);this.addToSignals("c_socialAction",c);this.addToSignals("c_socialTarget",d);this.addToSignals("c_socialPagePath",e)}},e=this.tv,d,g,h,l,t,v;d=0;for(g=e.length;d<g;d++)if(h=e[d],a.hasOwnProperty(h)&&c.hasOwnProperty(h)&&(v=a[h],v instanceof Array))for(l=0,t=v.length;l<t;l++)c[h].apply(this,v[l])},submit:function(){try{if(""!==this.errorMessage)return this.errorMessage;this.constructSignals();
    return this.hasSignals?(this.dil.api.signals(this.signals).submit(),"Signals sent: "+this.dil.helpers.convertObjectToKeyValuePairs(this.signals,"=",!0)+this.dil.log):"No signals present"}catch(a){return this.handle(a,"DIL.modules.GA.submit() caught error with message ",this.dil)}},Stuffer:{LIMIT:5,dil:null,cookieName:null,delimiter:null,errorMessage:"",handle:DIL.modules.helpers.handleModuleError,callback:null,v:function(){return!1},init:function(a,c,e){try{this.callback=this.dil=null,this.errorMessage=
    "",a instanceof DIL?(this.dil=a,this.v=this.dil.validators.isPopulatedString,this.cookieName=this.v(c)?c:"aam_ga",this.delimiter=this.v(e)?e:"|"):this.handle({message:"dilInstance is not a valid instance of DIL"},"DIL.modules.GA.Stuffer.init() error: ")}catch(d){this.handle(d,"DIL.modules.GA.Stuffer.init() caught error with message ",this.dil)}finally{return this}},process:function(a){var c,e,d,g,h,l;l=!1;var t=1;if(a===Object(a)&&(c=a.stuff)&&c instanceof Array&&(e=c.length))for(a=0;a<e;a++)if((d=
    c[a])&&d===Object(d)&&(g=d.cn,h=d.cv,g===this.cookieName&&this.v(h))){l=!0;break}if(l){c=h.split(this.delimiter);"undefined"===typeof window._gaq&&(window._gaq=[]);d=window._gaq;a=0;for(e=c.length;a<e&&!(l=c[a].split("="),h=l[0],l=l[1],this.v(h)&&this.v(l)&&d.push(["_setCustomVar",t++,h,l,1]),t>this.LIMIT);a++);this.errorMessage=1<t?"No errors - stuffing successful":"No valid values to stuff"}else this.errorMessage="Cookie name and value not found in json";if("function"===typeof this.callback)return this.callback()},
    submit:function(){try{var a=this;if(""!==this.errorMessage)return this.errorMessage;this.dil.api.afterResult(function(c){a.process(c)}).submit();return"DIL.modules.GA.Stuffer.submit() successful"}catch(c){return this.handle(c,"DIL.modules.GA.Stuffer.submit() caught error with message ",this.dil)}}}};
    DIL.modules.Peer39={aid:"",dil:null,optionals:null,errorMessage:"",calledBack:!1,script:null,scriptsSent:[],returnedData:[],handle:DIL.modules.helpers.handleModuleError,init:function(a,c,e){try{this.dil=null;this.errorMessage="";this.calledBack=!1;this.optionals=e===Object(e)?e:{};e={name:"DIL Peer39 Module Error"};var d=[],g="";this.isSecurePageButNotEnabled(document.location.protocol)&&(g="Module has not been enabled for a secure page",d.push(g),e.message=g,DIL.errorModule.handleError(e));c instanceof
    DIL?(this.dil=c,e.partner=this.dil.api.getPartner()):(g="dilInstance is not a valid instance of DIL",d.push(g),e.message=g,DIL.errorModule.handleError(e));"string"===typeof a&&a.length?this.aid=a:(g="aid is not a string or is empty",d.push(g),e.message=g,DIL.errorModule.handleError(e));this.errorMessage=d.join("\n")}catch(h){this.handle(h,"DIL.modules.Peer39.init() caught error with message ",this.dil)}finally{return this}},isSecurePageButNotEnabled:function(a){return"https:"===a&&!0!==this.optionals.enableHTTPS?
    !0:!1},constructSignals:function(){var a=this,c=this.constructScript(),e=DIL.variables.scriptNodeList[0];window["afterFinished_"+this.aid]=function(){try{var c=a.processData(p39_KVP_Short("c_p","|").split("|"));c.hasSignals&&a.dil.api.signals(c.signals).submit()}catch(e){}finally{a.calledBack=!0,"function"===typeof a.optionals.afterResult&&a.optionals.afterResult()}};e.parentNode.insertBefore(c,e);this.scriptsSent.push(c);return"Request sent to Peer39"},processData:function(a){var c,e,d,g,h={},l=
    !1;this.returnedData.push(a);if(a instanceof Array)for(c=0,e=a.length;c<e;c++)d=a[c].split("="),g=d[0],d=d[1],g&&isFinite(d)&&!isNaN(parseInt(d,10))&&(h[g]instanceof Array||(h[g]=[]),h[g].push(d),l=!0);return{hasSignals:l,signals:h}},constructScript:function(){var a=document.createElement("script"),c=this.optionals,e=c.scriptId,d=c.scriptSrc,c=c.scriptParams;a.id="string"===typeof e&&e.length?e:"peer39ScriptLoader";a.type="text/javascript";"string"===typeof d&&d.length?a.src=d:(a.src=document.location.protocol+
    "//stags.peer39.net/"+this.aid+"/trg_"+this.aid+".js","string"===typeof c&&c.length&&(a.src+="?"+c));return a},submit:function(){try{return""!==this.errorMessage?this.errorMessage:this.constructSignals()}catch(a){return this.handle(a,"DIL.modules.Peer39.submit() caught error with message ",this.dil)}}};

/*eslint-enable */
/* jshint ignore:end */
} catch (e) {
  _neo.nebu('adobeNativePlugins', e);
}

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

try {
  /* jshint ignore:start */
  /*eslint-disable */
  window.s.doPlugins = function s_doPlugins(s) {

    /**
    * HOIST PPD
    */
    if (!window.ppdSnapShot) {
      window.ppdSnapShot = _neo.jackin.getCookie('ppd') ? _neo.jackin.getCookie('ppd') : 'entry|entry';
    }

    /**
     * SERVER
     */
    // set server to first s_account value if comma delimited
    s.server = window.s_account.split(',')[0];
    /**
     * PROP9 - VERSION
     */
    // set prop9 to version number
    s.prop9 = window.s_code_version;
    /**
     * PROP46 - SITE TYPE
     */
    // set prop46 to legacy TMS-16
    // TODO: ensure always set to legacy based on using this on all experiences
    s.prop46 = 'legacy';

    /**
     * PROP65 - NEO SWIMLANE
     */
    // set prop65 to NEO swimlane cookie value
    s.prop65 = s.c_r('neo.swimlane');

    /**
     * JAPAN ID PAGE FIX
     * CURRENCY CODE AND EVENTS
     */
    // fix for Japan NikeId pages - 3/14/2014
    // TODO: is this still valid?
    if (s.currencyCode === 'YEN') {
      s.currencyCode = 'JPY';
    }
    s.events = s.events || '';

    /**
     * PAGE NAME
     */
    // Changed - DAT-525
    if (s.pageType === 'errorPage') {
      s.pageName = '404 error';
    }

    // DAT 1277
    s.pageName = s.pageName || 'page name not defined by engineering';
    s.pageName = function (pageName) {
      var escaped = escape(pageName.replace(/_/g, ' ').replace(/[.,'"‘’“”\\\/]/g, '')); // DREAMS-838: Remove select characters from pageName

      return unescape(escaped.replace(/(%u2014|%u00AD|%u2013|%u2011|%u2012|%u002D)/g, '-'));
    }(s.pageName);

    /**
     * CHANNEL FOR TRAINERS HUB
     */
    if (s.prop2 && !s.channel) {
      s.channel = s.prop2;
    }
    /**
     * REFERRER
     */

    function setReferrer(ref) {
      s.referrer = ref;
      s.Ra = '1';
    }

    // get referrer from query param or document
    if (document.location.href.indexOf('ref=') > -1) {
      setReferrer(s.getQueryParam('ref'));
    } else if (/switch\:|add\:/.test(s.prop8)) {
      // DAT-1534
      setReferrer('');
    } else {
      setReferrer(document.referrer);
    }
    // uri decode referrer when necessary
    if (s.referrer && s.referrer.lastIndexOf('http', 0) === 0 && s.referrer.charAt(6) !== '/') {
      var decodeCount = 0;

      while (s.referrer.charAt(6) !== '/' && decodeCount < 3) {
        setReferrer(decodeURIComponent(s.referrer));
        decodeCount++;
      }
    }
    // removes referrer if root domain is present in domain name
    var rd = window.location.hostname;
    var hnp = rd.split('.');
    var r = s.referrer.indexOf('/', 8) > -1 ? s.referrer.slice(0, s.referrer.indexOf('/', 8)) : s.referrer;

    if (hnp.length > 1) {
      var rdp = hnp.slice(hnp.length - 2);

      rd = rdp ? '.' + rdp.join('.') : rd;
    }
    if (r && r.indexOf(rd) > -1) {
      setReferrer('');
    }
    s._1_referrer = 1;

    // set prop54 to s.referrer DAT 1112
    s.prop54 = typeof s.referrer !== 'undefined' ? s.referrer : 'unknown';

    /**
     * PROP5 / EVAR70 - PREVIOUS PAGE
     */
    // set prop5 to previous page name
    // s.prop5 = s.getPreviousValue(s.pageName, 'c5', '');
    s.prop5 = window.ppdSnapShot.split('|')[1];

    // set prop5 to entry if no previous page in session
    // TODO: validate usage, do we need this based on above logic?
    if (typeof s.prop5 === 'undefined' || s.prop5 === '') {
      s.prop5 = 'entry';
    }

    // set prop5 to no page name defined
    // TODO: validate usage, can this even happen based on above logic?
    if (s.prop5 === 'no value') {
      s.prop5 = 'no page name defined';
    }
    // set evar70 to prop5
    s.eVar70 = 'D=c5';

    /**
     * PROP6 / EVAR60 - PREVIOUS PAGE TYPE
     */
    // set prop6 to previous value of prop17
    // s.prop6 = s.getPreviousValue(s.prop17, 'c6', '');
    s.prop6 = window.ppdSnapShot.split('|')[0];

    // set prop6 to entry if no previous prop17 in session
    // TODO: validate usage, can this be even happened based on the above logic?
    if (typeof s.prop6 === 'undefined' || s.prop6 === '') {
      s.prop6 = 'entry';
    }

    // set prop6 to no page type defined if no value
    // TODO: is this possible?
    if (s.prop6 === 'no value') {
      s.prop6 = 'no page type defined';
    }

    // set evar60 to prop6
    s.eVar60 = 'D=c6';

    /**
     * PROP69 and EVAR 79 - Referring url/ entry
     DAT-2268: Update so that on sort, c69 and v79 reflect the currently sorted pw,
     rather than entry (no full page load occurs).
     */
    // set to document.referrer, if it's first page load set to entry.
    if (!/sort\:/.test(s.prop3) && (/^https?:\/\/(store|www).nike.com\/?$/i.test(document.referrer) || document.referrer === '')) {
      s.prop69 = 'entry';
      s.eVar79 = 'entry';
    } else if (/sort\:/.test(s.prop3)) {
      s.prop69 = window.location.hostname + window.location.pathname;
      s.eVar79 = window.location.hostname + window.location.pathname;
    } else {
      s.prop69 = document.referrer;
      s.eVar79 = document.referrer;
    }

    /**
     * PROP23 - PREVIOUS PAGE PERCENT VIEWED
     */
    // check to see if last page was not entry
    if (!/entry/.test(s.prop5)) {
      s.prop23 = s.getPercentPageViewed()[1];
    }

    /**
     * PROP7 - PAGE NAME CORRELATION
     */
    // set prop7 to pagename or blank
    s.prop7 = s.pageName ? s.pageName : '';

    /**
     * PROP19 - SITE SECTION
     */
    if (window.s_account.indexOf('nikebrand') < 0) {
      // set prop19 to channel if prop19 doesn't exist and channel does
      if (!s.prop19 && s.channel) {
        s.prop19 = 'D=ch';

        // or append prop19 to channel if prop19 exists
      } else if (s.channel) {
        s.prop19 = 'D=ch+":' + s.prop19 + '"';
      }
    }

    /**
     * PROP24 / EVAR56 - USER AGENT
     */
    // set prop24 and evar56 to user agent
    s.prop24 = s.eVar56 = 'D=User-Agent';

    /**
     * PROP26 - URL
     */
    // set prop26 and scrub any email address from prop26 - DAT-311
    var emailRegex = /[a-zA-Z0-9!#$%'*+^_`{|}~-]+(?:\\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?/g;

    s.prop26 = decodeURIComponent(decodeURIComponent(window.location.href)).replace(emailRegex, '');

    /**
     * PROP37 / EVAR16 - TIME PARTING
     */
    // set prop37 and evar16 to time and day
    s.prop37 = s.getTimeParting('f', '-1');
    if (s.prop37) {
      s.eVar16 = 'D=c37';
    }
    /**
     * PROP51 - SCREEN ORIENTATION
     */
    // set prop51 to screen orientation, e.g. horizontal or vertical
    s.prop51 = s.screenOrient.getPrevPageValue('c51', '>>');
    /**
     * EVAR2 - EXACTTARGET RECEPIENT ID
     */
    // set evar2 to et_rid query param value
    s.eVar2 = s.getQueryParam('et_rid');
    /**
     * EVAR5 / PROP52 - A/B TESTING CLICK THRU TRACKING
     */
    // set evar5 to intpromo or pi query param values
    // TODO: remove pi from list?
    s.eVar5 = s.getQueryParam('intpromo,pi');
    if (s.eVar5) {
      // set event51 if evar5 is populated
      s.events = s.apl(s.events, 'event51', ',', 2);
      // set prop52 to evar5
      s.prop52 = 'D=v5';
    }
    /**
     * EVAR6 - REFERRING NIKE SITE
     */
    // set evar6 to sitesrc query param value
    s.eVar6 = s.getQueryParam('sitesrc');

    /**
     * EVAR7 - OLD CAMPAIGN BACKUP
     */
    // set evar7 to cp, cid, promoid, or et_cid query param values
    s.eVar7 = s.getQueryParam('cp') || s.getQueryParam('cid') || s.getQueryParam('promoid') || s.getQueryParam('et_cid');

    /**
     * EVAR8 - LANGUAGE
     */
    // set evar8 to prop15 if populated
    if (s.prop15) {
      s.eVar8 = 'D=c15';
    }
    /**
     * EVAR10 - PURCHASEID
     */
    // set evar10 to purcahseID if populated
    if (s.purchaseID) {
      s.eVar10 = 'D=purchaseID';
    }
    /**
     * EVAR55 / EVAR40 / EVAR71 / SEARCH EVENTS - SEACH TERMS AND EVENTS
     */
    // set evar55 to prop11 if populated DAT-506
    if (s.prop11) {
      s.eVar55 = 'D=c11';
    }
    // set event2 as successfulSearchEvent
    s.successfulSearchEvent = 'event2';
    // set event37 as nullSearchEvent
    s.nullSearchEvent = 'event37';
    // set prop11 as searchTermVariable
    s.searchTermVariable = 'prop11';
    // increment eVar40 each time a search term is entered
    if (s.prop11) {
      s.eVar40 = '+1';
    }
    // set evar71 to empyt string if event2 and event37 are not set
    if ((s.events + ',').indexOf('event2,') === -1) {
      if (s.events.indexOf('event37') === -1) {
        s.eVar71 = '';
      }
    }
    /**
     * EVAR12 - PRODUCT CATEGORY
     */
    // set evar12 to prop1
    if (s.prop1) {
      s.eVar12 = 'D=c1';
    }
    if (s.prop1 && !s.products) {
      s.products = ';';
    }
    /**
     * EVAR15 CHECKOUT TIME TO COMPLETE
     */

    // start timer at add to cart
    if (s.events && s.events.indexOf('scAdd') > -1 && !s.c_r('v15')) {
      s.ttc = 'start';
    }
    // stop timer at order confirmation
    if (s.events && s.events.indexOf('purchase') > -1) {
      s.ttc = 'stop';
    }
    // set evar15 to difference
    s.eVar15 = s.getTimeToComplete(s.ttc, 'v15', 28);

    /**
     * EVAR23 - COUNTRY
     */
    // set evar23 to prop14
    if (s.prop14) {
      s.eVar23 = 'D=c14';
    }
    /**
     * EVAR24 - SITE NAME
     */
    // set evar24 to prop2
    if (s.prop2) {
      s.eVar24 = 'D=c2';
    }
    /**
     * EVAR28 - BANDWIDTH
     */
    // set evar28 to bandwidth value from akamai's geoloc cookie
    var geo = /geoloc=.*bw=([0-9A-z]+)/.exec(document.cookie);

    if (geo && (typeof geo === 'undefined' ? 'undefined' : _typeof(geo)) === 'object' && geo.length >= 2) {
      s.eVar28 = geo[1];
    }

    /**
     * EVAR22 - A/B TESTING INTEGRATION
     */
    // set evar22 from a sorted neo.experiments cookie
    var neoExperimentsObject = {};
    var neoExperimentsArray = [];

    try {
      neoExperimentsObject = JSON.parse(s.c_r('neo.experiments'));
    } catch (e) {
      // do nothing
    }

    Object.keys(neoExperimentsObject).forEach(function (profile) {
      Object.keys(neoExperimentsObject[profile]).forEach(function (experiment) {
        neoExperimentsArray.push(experiment + ':' + neoExperimentsObject[profile][experiment]);
      });
    });

    s.eVar22 = neoExperimentsArray.filter(function (el, i, arr) {
      return arr.indexOf(el) === i;
    }).sort().join('|');

    /**
     * PROP30 / PROP49 - GUIDU AND GUIDS
     */
    // set prop30 and prop49 from GUID cookies
    s.prop30 = s.c_r('guidU') || '';
    s.prop49 = s.c_r('guidS') || '';

    /**
     * VISITORID - STITCH HYBRID MOBILE APP VISITS
     */
    // Ties hybrid mobile app/web visits together
    // More info: http://blogs.adobe.com/digitalmarketing/digital-marketing/mobile/hybrid-apps-making-whole-two-halves/
    if (s.getQueryParam('appvi')) {
      s.new_vi_date = new Date();
      s.new_vi_date.setFullYear(s.new_vi_date.getFullYear() + 5);
      s.c_w('app_vi', s.getQueryParam('appvi'), s.new_vi_date);
      s.visitorID = s.c_r('app_vi');
    } else if (s.c_r('app_vi')) {
      s.visitorID = s.c_r('app_vi');
    }

    /**
     * EVAR15 / EVAR54 - DCF CAMPAIGN TRACKING
     */
    (function (s) {
      if (s.eVar59) {
        s.eVar15 = s.eVar59;
        s.eVar54 = s.eVar59.split('|').pop();
        s.linkTrackVars += ',eVar15,eVar54';
      }
    })(s);

    /**
     * PROP56 - IPHONE SCREEN RESOLUTION
     * PROP66 - IPAD SCREEN RESOLUTION
     */

    s.prop56 = window.navigator && window.navigator.userAgent && /iPhone/.test(window.navigator.userAgent) ? screen.width + 'x' + screen.height : null;
    s.prop66 = window.navigator && window.navigator.userAgent && /iPad/.test(window.navigator.userAgent) ? screen.width + 'x' + screen.height : null;

    /**
     * PRODUCTS
     */
    // eVar49 replaced by eVar11 in product string; Jira ticket DAT-89
    if (s.products) {
      s.products = s.products.replace('evar49=no search phrase', 'evar11=no search phrase');
    }

    /**
     * EVAR33 - PDP VIEWS BEFORE EVENT
     */
    // increment evar33 when event4 occurs
    if (s.events && (s.events + ',').indexOf('event4,') > -1) {
      s.eVar33 = '+1';
    }
    /**
     * EVAR34 - PAGE VIEWS BEFORE EVENT
     */
    // increment evar34
    s.eVar34 = '+1';

    /**
     * EVAR37 - KENSHOO INTEGRATION
     */
    // set evar37 to k_clickid query param value
    s.eVar37 = s.getQueryParam('k_clickid');

    /**
     * EVAR46 - ORDERS BEFORE EVENT
     */
    // increment evar46 on purchase event
    if (s.events && s.events.indexOf('purchase') > -1) {
      s.eVar46 = '+1';
    }
    /**
     * EVAR48 - PAGE NAME
     */
    // set evar48 to pagename
    s.eVar48 = 'D=pageName';
    /**
     * EVAR50 - EXACT TARGET CAMPAIGN ID INTEGRATION
     */
    // set evar50 to et_cid query param value
    // TODO: check usage, redundant with evar7
    s.eVar50 = s.getQueryParam('et_cid');

    /**
     * EVAR62 - SITE ERRORS
     */
    // set evar62 to prop13
    if (s.prop13) {
      s.eVar62 = 'D=c13';
    }
    /**
     * EVAR63 - SPORT CATEGORY
     */
    // set evar63 to prop12
    if (s.prop12) {
      s.eVar63 = 'D=c12';
    }
    /**
     * PROP58 / PROP59 - PRODUCT WALL HASH VALUES
     */
    // set prop58 to PW hash value DAT-952
    var pathArray = window.location.pathname.split('/');

    if (pathArray[3] === 'pw') {
      s.prop58 = pathArray.pop();
    }
    // set prop59 to previous PW hash value DAT-953
    var prevHash = s.getPreviousValue(s.prop58, 'c58', '');

    if (prevHash && prevHash !== 'no value') {
      s.prop59 = prevHash;
    }
    /**
     * PROP43 / EVAR54 - SPORT CATEGORY
     */
    // set prop43 and evar 54 to sport category
    (function () {
      if (s.prop12 || s.list2) {
        var value = s.prop12 ? s.prop12.toLowerCase() : s.list2.toLowerCase();
        var result = '';
        var containsMap = {
          'american football|nfl|us-football': 'american football',
          'running|track': 'running',
          soccer: 'global football',
          'yoga|womens-training': 'womens training',
          'sport:football': 'global football',
          'sport:training': 'athletic training'
        };
        var equalsMap = {
          football: 'global football',
          training: 'athletic training'
        };

        if (equalsMap[value]) {
          result = equalsMap[value];
        } else {
          for (var prop in containsMap) {
            var propArray = prop.split('|');

            for (var j = 0; j < propArray.length; j++) {
              if (value === propArray[j]) {
                result = containsMap[prop];
                break;
              }
            }
          }
        }

        if (result) {
          s.prop43 = result;
          s.eVar54 = 'D=c43';
        }
      }
    })();
    /**
     * EVAR67 - PRODUCT FINDING METHOD (PDP VIEW)
     */
    // increment evar67 when event20 occurs
    if (s.events && s.events.indexOf('event20') > -1) {
      s.eVar67 = '+1';
    }

    /**
     * PROP28 - APP MEASUREMENT VERSION
     DAT-2315: updated to s.version
     */
    // set prop28 to app measurement version
    s.prop28 = s.version;

    /**
     * LIST3 - PREVIOUS PRODUCT WALL FACET STATE
     */

    var prevList2 = s.c_r('prevList2');

    if (prevList2.length > 0) {
      s.list3 = prevList2;
    }
    if (!s.pev2 && typeof s.list2 !== 'undefined') {
      s.c_w('prevList2', s.list2);
    }

    /**
     * EVAR25 - COPY OF PAGE URL IN PROP26
     */
    s.eVar25 = 'D=c26';

    /**
     * EVAR31 - PAGE DOMAIN
     */
    s.eVar31 = window.location.hostname;

    /**
     * PROP44 - PAGE OF LINK CLICK
     */
    // set prop44 to page of click - DAT-348
    if (s.pev2) {
      s.prop44 = s.pageName;
    } else {
      s.prop44 = s.prop5;
    }

    /**
     * EVENT100 - CLICK TRACKING EVENT
     */
    // set event100 for any click - DAT-467
    if (s.pev2) {
      s.events = s.events ? s.events + ',event100' : 'event100';
      s.linkTrackEvents = s.linkTrackEvents === '' || typeof s.linkTrackEvents === 'undefined' || s.linkTrackEvents === 'None' ? s.linkTrackEvents = 'event100' : s.linkTrackEvents += ',event100';
      s.linkTrackVars = s.linkTrackVars === '' || typeof s.linkTrackVars === 'undefined' ? s.linkTrackVars = 'events' : s.linkTrackVars += ',events';
    }

    /**
     * PROP74 - MID
     * DAT-1610
     */

    if (s.getQueryParam('mcloudid')) {
      s.c_w('mcloudid', s.getQueryParam('mcloudid'));
    }

    if (s.c_r('mcloudid')) {
      s.prop74 = s.c_r('mcloudid');
    }

    /**
     * eVar83: Product price on PDP
     **/
    if (_neo.main || _neo.mobile) {
      var data = _neo.main && _neo.main.data() || _neo.mobile && _neo.mobile.data() || null;
      var pageType = _neo.shared.data().pageType();
      var array = [];

      if (data && data.product_price_local === '') {
        s.eVar83 = 'no data available';
      } else if (data && pageType === 'pdp') {
        // need to account for YEN
        var price = data.product_price_local;
        var priceSplit = price.split('');

        priceSplit.forEach(function (index) {
          var parsedIndex = parseInt(index, 10);

          if (isNaN(parsedIndex) === false || index === '.') {
            index === '.' ? array.push(index) : array.push(parsedIndex);
          }
        });
        array[array.length - 1] === '.' ? array.pop() : '';
        array = array.join('');
        s.eVar83 = array;
      }
    }
    s.eVar83 === undefined ? s.eVar83 = 'no data available' : '';

    var num = 'R 1,699.95';

    for (var i = 0; i < num.length; i++) {
      if (isNaN(parseInt(num[0], 10))) {
        num = num.slice(i, i + 1);
      }
    }

    // check to see if we are in main, mobile or OCP, and that pageName exists
    if (!s.pev2) {
      s.profile = s.prop9 && s.prop9.split('_') && s.prop9.split('_')[1];
      if (s.pageName && (s.profile === 'main' || s.profile === 'mobile' || s.profile === 'ocp')) {
        if (/not set/.test(s.products)) {
          s.products = s.products.split('not set').join('no method found');
        }
      }
    }
    /**
     * LOWERCASE VALUES EXCEPT PROP26 / PROP58 / PROP59
     */
    for (var a = 1; a <= 75; a++) {
      var propKey = 'prop' + a;
      var eVarKey = 'eVar' + a;
      var listKey = 'list' + a;
      var propValue = s[propKey];
      var eVarValue = s[eVarKey];
      var listValue = s[listKey];

      if (propValue && typeof propValue === 'string') {
        // Do not lowercase prop26 - DAT-513
        if (a !== 24 && a !== 26 && a !== 54 && a !== 58 && a !== 59 && propValue.indexOf('/pw/') < 0) {
          s[propKey] = propValue.toLowerCase().replace(/^d=/, 'D=');
        }
      }
      if (a !== 25 && a !== 56 && eVarValue && typeof eVarValue === 'string') {
        s[eVarKey] = eVarValue.toLowerCase().replace(/^d=/, 'D=');
      }
      if (a <= 3 && listValue && typeof listValue === 'string') {
        s[listKey] = listValue.toLowerCase().replace(/^d=/, 'D=');
      }
    }
    var b = ['pageName', 'channel', 'server'];

    for (var _a = 0; _a < b.length; _a++) {
      s[b[_a]] && (s[b[_a]] = s[b[_a]].toLowerCase().replace(/^d=/, 'D='));
    }
    s.plugins = '';
  };
  /*eslint-enable */
  /* jshint ignore:end */
} catch (e) {
  _neo.nebu('adobeCustomPlugins', e);
}
_neo.matrix.push({
  id: 'usabilla',
  name: 'usabilla tag load',
  active: 1,
  persist: 0,
  privacy: 2,
  qual: {
    country: 'ae|ar|at|au|be|bg|ca|ch|cl|cn|cz|de|dk|eg|es|fi|fr|gb|gr|hr|hu|id|ie' + '|il|in|it|jp|lu|ma|mx|my|nl|no|nz|pl|pr|pt|ro|ru|sa|se|sg|sk|th|tr|tw|us|vn|za',
    listener: {
      type: 'dom',
      name: 'load'
    }
  },
  agents: {
    BrowserDetect: {
      init: function init() {
        this.browser = this.searchString(this.dataBrowser) || 'An unknown browser';
        this.version = this.searchVersion(navigator.userAgent) || this.searchVersion(navigator.appVersion) || 'an unknown version';
        this.OS = this.searchString(this.dataOS) || 'an unknown OS';
      },
      searchString: function searchString(e) {
        for (var t = 0; t < e.length; t++) {
          var n = e[t].string;
          var r = e[t].prop;

          this.versionSearchString = e[t].versionSearch || e[t].identity;
          if (n) {
            if (n.indexOf(e[t].subString) != -1) return e[t].identity;
          } else if (r) return e[t].identity;
        }
      },
      searchVersion: function searchVersion(e) {
        var t = e.indexOf(this.versionSearchString);

        if (t == -1) return;

        return parseFloat(e.substring(t + this.versionSearchString.length + 1));
      },

      dataBrowser: [{
        string: navigator.userAgent,
        subString: 'Chrome',
        identity: 'Chrome'
      }, {
        string: navigator.vendor,
        subString: 'Apple',
        identity: 'Safari',
        versionSearch: 'Version'
      }, {
        prop: window.opera,
        identity: 'Opera',
        versionSearch: 'Version'
      }, {
        string: navigator.userAgent,
        subString: 'Firefox',
        identity: 'Firefox'
      }, {
        string: navigator.userAgent,
        subString: 'MSIE',
        identity: 'Explorer',
        versionSearch: 'MSIE'
      }],
      dataOS: [{
        string: navigator.platform,
        subString: 'Win',
        identity: 'Windows'
      }, {
        string: navigator.platform,
        subString: 'Mac',
        identity: 'Mac'
      }, {
        string: navigator.userAgent,
        subString: 'iPhone',
        identity: 'iPhone/iPod'
      }, {
        string: navigator.userAgent,
        subString: 'Android',
        identity: 'Android'
      }, {
        string: navigator.platform,
        subString: 'Linux',
        identity: 'Linux'
      }]
    }
  },
  variants: {
    a: {
      lanes: [0, 99],
      dm: function dm(program) {
        // Set up flag for OCP to know whether to display feedback link

        if (_neo.jackin.getFromObject(window, 'nike.ocp.ab')) {
          nike.ocp.ab.feedbackEnabled = false;
        }

        // Make sure we are not in an IE 6/7/8 browser - DAT-441
        if (program.agents.BrowserDetect.browser === 'Explorer' && program.agents.BrowserDetect.version >= 9 || program.agents.BrowserDetect.browser !== 'Explorer') {
          var oneNikeNav = '\n            .exp-onenikenav-feedback {\n              cursor: pointer;\n              display: block !important;\n            }';
          var stylesheet = document.createElement('style');

          /* jshint ignore:start */
          /*eslint-disable */
          window.lightningjs || function (c) {
            try {
              var g = function g(b, d) {
                d && (d += (/\?/.test(d) ? "&" : "?") + "lv=1");c[b] || function () {
                  var i = window,
                      h = document,
                      j = b,
                      g = h.location.protocol,
                      l = "load",
                      k = 0;(function () {
                    function b() {
                      a.P(l);a.w = 1;c[j]("_load");
                    }c[j] = function () {
                      function m() {
                        m.id = e;return c[j].apply(m, arguments);
                      }var b,
                          e = ++k;b = this && this != i ? this.id || 0 : 0;(a.s = a.s || []).push([e, b, arguments]);m.then = function (b, c, h) {
                        var d = a.fh[e] = a.fh[e] || [],
                            j = a.eh[e] = a.eh[e] || [],
                            f = a.ph[e] = a.ph[e] || [];b && d.push(b);c && j.push(c);h && f.push(h);return m;
                      };return m;
                    };var a = c[j]._ = {};a.fh = {};a.eh = {};a.ph = {};a.l = d ? d.replace(/^\/\//, (g == "https:" ? g : "http:") + "//") : d;a.p = { 0: +new Date() };a.P = function (b) {
                      a.p[b] = new Date() - a.p[0];
                    };a.w && b();i.addEventListener ? i.addEventListener(l, b, !1) : i.attachEvent("on" + l, b);var q = function q() {
                      function b() {
                        return ["<head></head><", c, ' onload="var d=', n, ";d.getElementsByTagName('head')[0].", d, "(d.", g, "('script')).", i, "='", a.l, "'\"></", c, ">"].join("");
                      }var c = "body",
                          e = h[c];if (!e) return setTimeout(q, 100);a.P(1);var d = "appendChild",
                          g = "createElement",
                          i = "src",
                          k = h[g]("div"),
                          l = k[d](h[g]("div")),
                          f = h[g]("iframe"),
                          n = "document",
                          p;k.style.display = "none";e.insertBefore(k, e.firstChild).id = o + "-" + j;f.frameBorder = "0";f.id = o + "-frame-" + j;/MSIE[ ]+6/.test(navigator.userAgent) && (f[i] = "javascript:false");f.allowTransparency = "true";l[d](f);try {
                        f.contentWindow[n].open();
                      } catch (s) {
                        a.domain = h.domain, p = "javascript:var d=" + n + ".open();d.domain='" + h.domain + "';", f[i] = p + "void(0);";
                      }try {
                        var r = f.contentWindow[n];r.write(b());r.close();
                      } catch (t) {
                        f[i] = p + 'd.write("' + b().replace(/"/g, String.fromCharCode(92) + '"') + '");d.close();';
                      }a.P(2);
                    };a.l && setTimeout(q, 0);
                  })();
                }();c[b].lv = "1";return c[b];
              };

              var o = "lightningjs",
                  k = window[o] = g(o);k.require = g;k.modules = c;
            } catch (e) {
              throw new Error('usabilla lightningjs error defensively caught by NEO: ' + e.toString(), 'usabilla.js', '114');
            }
          }({});
          /*eslint-enable */
          /* jshint ignore:end */
          window.usabilla_live = window.lightningjs.require('usabilla_live', '//w.usabilla.com/9f210deab147.js');
          window.usabilla_live('data', _neo.shared.data().usabilla_ids).then(function () {
            if (_neo.jackin.getFromObject(window, 'nike.Event.USABILLA_LOADED') && _neo.jackin.getFromObject(window, 'nike.dispatchEvent')) {
              nike.dispatchEvent(nike.Event.USABILLA_LOADED);
            }
          });

          // Hide feedback button since OCP will display a feedback link instead
          if (_neo.jackin.getFromObject(window, 'nike.ocp.ab')) {
            nike.ocp.ab.feedbackEnabled = true;
          }

          // style feedback link on third party pages so pointer is present
          stylesheet.setAttribute('type', 'text/css');
          stylesheet.innerHTML = oneNikeNav;
          document.head.appendChild(stylesheet);

          // Turn on flag for OCP to display feedback link
          if (_neo.jackin.getFromObject(window, 'nike.ocp.ab')) {
            nike.ocp.ab.feedbackEnabled = true;
          }
        }

        return true;
      }
    }
  }
});
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/* eslint no-unused-expressions: ['error', { 'allowTernary': true }] */
/* eslint camelcase:0 */
/* eslint one-var:0 */

_neo.matrix.push({
  id: 'doubleclick-legacy',
  name: 'Doubleclick Legacy',
  active: 1,
  persist: 0,
  privacy: 2,
  qual: {
    listener: {
      type: 'dom',
      name: 'load'
    }
  },
  agents: {
    countryCodes: {
      us: 'usd',
      pr: 'usd',
      cn: 'cny',
      hk: 'cny',
      dk: 'dkk',
      gb: 'gbp',
      jp: 'jpy',
      se: 'sek',
      at: 'eur',
      fi: 'eur',
      fr: 'eur',
      de: 'eur',
      ie: 'eur',
      it: 'eur',
      lu: 'eur',
      es: 'eur',
      nl: 'eur',
      be: 'eur',
      cz: 'czk',
      gr: 'eur',
      hu: 'huf',
      pt: 'eur',
      si: 'eur',
      sk: 'eur',
      no: 'nok',
      pl: 'pln',
      ch: 'chf',
      ca: 'cad',
      bg: 'bgn',
      cl: 'clp',
      mx: 'mxn',
      sa: 'sar',
      tr: 'try',
      ae: 'aed',
      ru: 'rub',
      il: 'ils',
      hr: 'hrk',
      ro: 'ron',
      eg: 'egp',
      ma: 'mad',
      za: 'zar',
      au: 'aud',
      nz: 'nzd',
      id: 'idr',
      in: 'inr',
      my: 'myr',
      sg: 'sgd',
      th: 'thb',
      tw: 'twd',
      vn: 'vnd'
    },
    suffixesAreFun: ['us', 'pr', 'cn', 'hk', 'dk', 'gb', 'jp', 'se', 'at', 'fi', 'fr', 'de', 'ie', 'it', 'lu', 'es', 'nl', 'be', 'cz', 'gr', 'hu', 'pt', 'si', 'sk', 'no', 'ch'],
    // For cat param, checks page_facets on desktop product walls to determine cat value
    pfacet_map: [{
      regex: /footwear.*men.*training|equipment.*men.*training|clothing.*men.*training/i,
      output: 'trainmen'
    }, {
      regex: /.*lacrosse.*/i,
      output: 'lacrosse'
    }, {
      regex: /.*skateboarding./i,
      output: 'skate123'
    }, {
      regex: /.*snowboarding.*/i,
      output: 'snowbrdg'
    }, {
      regex: /.*customize with nikeid.*|.*nikeid.*/i,
      output: 'idprodct'
    }, {
      regex: /.*soccer|football.*|.*magitsa.*|.*tiempo.*|.*hypervenom.*|.*mercurial.*|.*football.*|.*magista.*|.*riskeverything.*/i,
      output: 'football'
    }, {
      regex: /rafael nadal|maria sharapova|roger federer|serena williams|.*tennis.*/i,
      output: 'tennis12'
    }, {
      regex: /american football.*|.*nfl.*/i,
      output: 'usftball'
    }, {
      regex: /elite series|lebron elite collection|kobe elite collection|kd elite collection|.*basketball.*/i,
      output: 'bsktball'
    }, {
      regex: /.*golf.*/i,
      output: 'golf1234'
    }, {
      regex: /.*mlb.*/i,
      output: 'baseball'
    }, {
      regex: /.*running.*/i,
      output: 'running1'
    }, {
      regex: /.*jordan.*/i,
      output: 'jordan'
    }, {
      regex: /.*bra.*|.*nikepro360fit.*/i,
      output: 'trainwom'
    }, {
      regex: /.*sportswear.*/i,
      output: 'nsw'
    }],
    // For cat param, checks pageID on all desktop non PWs to determine cat value
    landcat_map: [{
      regex: /pdp.*/i,
      output: 'pdppages'
    }, {
      regex: /skateboarding.*/i,
      output: 'skate123'
    }, {
      regex: /snowboarding.*/i,
      output: 'snowbrdg'
    }, {
      regex: /.*basketball,customize with nikeid,men/i,
      output: 'idprodct'
    }, {
      regex: /baseball.*/i,
      output: 'baseball'
    }, {
      regex: /womens-training.*/i,
      output: 'trainwom'
    }, {
      regex: /.*women*/i,
      output: 'womenhp'
    }, {
      regex: /golf.*/i,
      output: 'golf1234'
    }, {
      regex: /running.*/i,
      output: 'running1'
    }, {
      regex: /^football.*/i,
      output: 'football'
    }, {
      regex: /tennis.*/i,
      output: 'tennis12'
    }, {
      regex: /us-football.*/i,
      output: 'usftball'
    }, {
      regex: /view_www_home/i,
      output: 'nikehome'
    }, {
      regex: /nike-free.*/i,
      output: 'running1'
    }, {
      regex: /cricket.*/i,
      output: 'cricket1'
    }, {
      regex: /^training.*/i,
      output: 'trainmen'
    }, {
      regex: /nikeid,?$/i,
      output: 'idhome12'
    }, {
      regex: /nfl.*/i,
      output: 'usftball'
    }, {
      regex: /nikeid,nikeid-nfl-landing-page.*/i,
      output: 'idprodct'
    }, {
      regex: /jordan.*/i,
      output: 'jordan'
    }, {
      regex: /nikeplus-fuelband/i,
      output: 'fbspslp1'
    }, {
      regex: /basketball.*/i,
      output: 'bsktball'
    }, {
      regex: /magista.*|riskeverything.*|soccer.*|.*mercurial*|.*hypervenom.*|.*tiempo.*|.*magitsa.*|.*riskeverything.*/i,
      output: 'football'
    }, {
      regex: /.*bra.*|.*nikepro360fit.*/i,
      output: 'trainwom'
    }, {
      regex: /.*sportswear.*/i,
      output: 'NSW'
    }, {
      regex: /.*dri-fit.*/i,
      output: 'dri-fit'
    }, {
      regex: /.*flyknit.*/i,
      output: 'flynit'
    }, {
      regex: /.*men.*/i,
      output: 'menhp'
    }, {
      regex: /.*zoom.*/i,
      output: 'zoom'
    }, {
      regex: /.*hurley.*/i,
      output: 'hurley'
    }, {
      regex: /register.*/i,
      output: 'member'
    }],
    // For cat param, checks mobile URL for cat values
    mobile_cat_map: [{
      regex: /jordan/i,
      output: 'jordan'
    }, {
      regex: /lebron/i,
      output: 'bsktball'
    }, {
      regex: /running/i,
      output: 'running1'
    }, {
      regex: /run/i,
      output: 'running1'
    }, {
      regex: /us-football/i,
      output: 'usftbal'
    }, {
      regex: /football/i,
      output: 'football'
    }, {
      regex: /basketball/i,
      output: 'bsktball'
    }, {
      regex: /soccer/i,
      output: 'football'
    }, {
      regex: /baseball/i,
      output: 'baseball'
    }, {
      regex: /cricket/i,
      output: 'cricket1'
    }, {
      regex: /golf/i,
      output: 'golf1234'
    }, {
      regex: /lacross/i,
      output: 'lacrosse'
    }, {
      regex: /womens-training/i,
      output: 'trainwom'
    }, {
      regex: /kobe/i,
      output: 'bsktball'
    }, {
      regex: /kd/i,
      output: 'bsktball'
    }, {
      regex: /tennis/i,
      output: 'tennis12'
    }, {
      regex: /rafael-nadal/i,
      output: 'tennis12'
    }, {
      regex: /maria-sharapova/i,
      output: 'tennis12'
    }, {
      regex: /roger-federer/i,
      output: 'tennis12'
    }, {
      regex: /mens-training/i,
      output: 'trainmen'
    }, {
      regex: /skateboarding/i,
      output: 'skate123'
    }, {
      regex: /stefan-janoski/i,
      output: 'skate123'
    }, {
      regex: /snowboarding/i,
      output: 'snowbrdg'
    }, {
      regex: /magista/i,
      output: 'football'
    }, {
      regex: /riskeverything/i,
      output: 'football'
    }, {
      regex: /training/i,
      output: 'trainmen'
    }, {
      regex: /sportswear/i,
      output: 'NSW'
    }, {
      regex: /dri-fit/i,
      output: 'dri-fit'
    }, {
      regex: /flyknit/i,
      output: 'flynit'
    }, {
      regex: /men/i,
      output: 'menhp'
    }, {
      regex: /women/i,
      output: 'womenhp'
    }, {
      regex: /innovation\/zoom/i,
      output: 'zoom'
    }, {
      regex: /hurley/i,
      output: 'hurley'
    }, {
      regex: /register/i,
      output: 'member'
    }],
    type_map: [{
      regex: /nikeid/i,
      output: 'nikeid12'
    }, {
      regex: /www_home/i,
      output: 'homepage'
    }, {
      regex: /register.*/i,
      output: 'regconfm'
    }],
    buildImgSrc: function buildImgSrc(construct, type, cat) {
      var data = void 0;
      var shared = {};
      var env = '';

      shared = _neo.shared.data();
      env = construct.env;

      var joinDataPoints = function joinDataPoints(value) {
        if (typeof value === 'string') {
          return value;
        } else if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object') {
          return value.join('|');
        }

        return '';
      };

      var imgSourceString = function imgSourceString(order_quant, order_total, prod_quant, prod_sku, prod_names, prod_type, prod_price, curr, prod_size, order_id) {
        // look for qty and cost parameters if applicable
        var sumTotalItems = Array.isArray(prod_quant) && prod_quant.length ? prod_quant.reduce(function (x, y) {
          return Number(x) + Number(y);
        }, 0) : 0;

        if (sumTotalItems <= 0) {
          sumTotalItems = order_quant;
        }
        var sales_tag_parameters = void 0;
        var switchboard = _neo.switchboard;

        if (switchboard.cart.qual.node() || switchboard.ocp_confirm.qual.node() || switchboard.gs_confirm.qual.node()) {
          sales_tag_parameters = ';qty=' + sumTotalItems + ';cost=' + order_total;
        } else {
          sales_tag_parameters = '';
        }

        // build tag
        var img_src = '' + ('https://4171764.fls.doubleclick.net/activityi;src=4171764;' +
        // type
        'type=') + type
        // category
        + ';cat=' + cat
        // sales tag parameters, if cart or orderconfirmation tag
        + sales_tag_parameters
        // country
        + ';u1=' + construct.country
        // language
        + ';u2=' + construct.language
        // page type
        + ';u3=' + shared.pageType()
        // page id
        + ';u4=' + shared.pageId()
        // order quantity
        + ';u5=' + sumTotalItems
        // items PIDS
        + ';u6=' + joinDataPoints(prod_sku)
        // Product Name
        + ';u10=' + joinDataPoints(prod_names)
        // Category
        + ';u11=' + joinDataPoints(prod_type)
        // Quantity
        + ';u12=' + joinDataPoints(prod_quant)
        // Price
        + ';u13=' + joinDataPoints(prod_price)
        // Currency
        + ';u14=' + curr
        // Product Sizes
        + ';u15=' + prod_size
        // href
        + ';u17=' + encodeURIComponent(window.location.hostname + window.location.pathname) + ';dc_lat=;dc_rdid=;tag_for_child_directed_treatment=;' + (
        // order id
        'ord=' + order_id + '?');

        return img_src;
      };

      if (env === 'main') {
        data = _neo.main.data();

        return imgSourceString('', '', '', data.product_id, data.product_name, data.product_category, data.product_price_local, '', '', Date.now());
      } else if (env === 'mobile') {
        data = _neo.mobile.data();

        return imgSourceString('', '', '', data.product_id, data.product_name, data.product_type, data.product_price_local, '', '', Date.now());
      } else if (env === 'ocp' || construct.env === 'globalstore') {
        _neo.ocp ? data = _neo.ocp.data() : data = _neo.globalstore.data();
        if (typeof data.order_product_sizes === 'undefined') {
          data.order_product_sizes = '';
        }

        return imgSourceString(data.order_quantity, data.order_total, data.order_product_quantity, data.order_product_sku, data.order_product_names, data.order_product_type, data.order_product_price, data.order_currency, data.order_product_sizes, data.order_id);
      } else if (env === 'thirdparty') {
        return imgSourceString('', '', '', '', '', '', '', '', '', Date.now());
      }

      return false;
    }
  },
  variants: {
    a: {
      lanes: [0, 99],
      dm: function dm(program, construct) {
        var cat = '';
        var land_page = '';
        var reg = '';

        var country_code = program.agents.countryCodes[construct.country] || '';
        var sb = _neo.switchboard;
        var type = 'category';
        var data = _neo.shared.data();
        var page_facets = data.page_facets;

        // if geo is not in countryCodes object, return false.
        if (program.agents.countryCodes[construct.country] === undefined) {
          return false;
        }

        // main cat
        if (_neo.main) {
          cat = 'default1';
          land_page = data.pageId();
          // sets cat if regex for pw
          if (sb.pw.qual.node()) {
            for (var j = 0; j < program.agents.pfacet_map.length; j++) {
              reg = program.agents.pfacet_map[j].regex;
              if (reg.test(page_facets)) {
                cat = program.agents.pfacet_map[j].output;
                break;
              }
            }
          } else {
            for (var i = 0; i < program.agents.landcat_map.length; i++) {
              reg = program.agents.landcat_map[i].regex;
              if (reg.test(land_page)) {
                cat = program.agents.landcat_map[i].output;
                break;
              }
            }
          }
        } else if (_neo.mobile) {
          cat = 'default1';
          // sets cat from mobile map
          for (var l = 0; l < program.agents.mobile_cat_map.length; l++) {
            reg = program.agents.mobile_cat_map[l].regex;
            if (reg.test(window.location.pathname)) {
              cat = program.agents.mobile_cat_map[l].output;
              break;
            }
          }

          // sets cat for pdp or homepage from pageType()
          land_page = data.pageType();
          if (/pdp/.test(land_page)) {
            cat = 'pdppages';
          } else if (/www_home/.test(land_page)) {
            cat = 'nikehome';
          }
        }

        // sets type for main and mobile if match for type_map
        for (var k = 0; k < program.agents.type_map.length; k++) {
          reg = program.agents.type_map[k].regex;
          if (reg.test(land_page)) {
            type = program.agents.type_map[k].output;
          }
        }

        // unite registration
        if (!_neo.globalstore && construct.env !== 'thirdparty') {
          if (typeof nike !== 'undefined') {
            nike.listen('uniteRegisterSuccess', function () {
              _neo.din(program.agents.buildImgSrc(construct, 'regconfm', 'memconfi'), 'iframe', 'body');
            });
          }
        }

        if (sb.nike_home.qual.node()) {
          // homepage
          _neo.din(program.agents.buildImgSrc(construct, type, 'nikehome'), 'iframe', 'body');
        } else if (sb.cdp.qual.node()) {
          // category page
          _neo.din(program.agents.buildImgSrc(construct, type, cat), 'iframe', 'body');
        } else if (sb.slp.qual.node()) {
          // landing page
          _neo.din(program.agents.buildImgSrc(construct, type, cat), 'iframe', 'body');
        } else if (sb.pw.qual.node() || sb.giftcards_land.qual.node() || sb.email_signup.qual.node()) {
          // product wall (includes gift card page and email signup for dc)
          _neo.din(program.agents.buildImgSrc(construct, type, cat), 'iframe', 'body');
        } else if (sb.pdp_desktop.all_pdp_except_id.qual.node() || sb.pdp_mobile.all_pdp_except_id.qual.node()) {
          // pdp
          _neo.din(program.agents.buildImgSrc(construct, type, cat), 'iframe', 'body');
        } else if (sb.pdp_desktop.id.qual.node() || sb.pdp_mobile.id.qual.node()) {
          // NEO-2697 - NikeID pdp
          _neo.din(program.agents.buildImgSrc(construct, type, cat), 'iframe', 'body');
        } else if (sb.pdp_desktop.id.qual.node() || sb.pdp_mobile.id.qual.node()) {
          // builder pdp
          _neo.din(program.agents.buildImgSrc(construct, type, cat), 'iframe', 'body');
        } else if (sb.store_locator.qual.node()) {
          // store-locator
          cat = 'storelo';
          _neo.din(program.agents.buildImgSrc(construct, type, cat), 'iframe', 'body');
        } else if (sb.cities.qual.node()) {
          // cities pages (DAT-2356)
          _neo.din(program.agents.buildImgSrc(construct, type, 'default1'), 'iframe', 'body');
        } else if (sb.cart.qual.node()) {
          // cart
          cat = 'cart' + country_code + (program.agents.suffixesAreFun.indexOf(construct.country) > -1 ? '1' : '');
          _neo.din(program.agents.buildImgSrc(construct, 'shopcart', cat), 'iframe', 'body');
        } else if (sb.ocp_shipping.qual.node()) {
          // checkout registration
          if (typeof nike !== 'undefined') {
            nike.listen('registrationComplete', function () {
              cat = 'coreg' + country_code;
              _neo.din(program.agents.buildImgSrc(construct, 'regconfm', cat), 'iframe', 'body');
            });
          }
        } else if (sb.gs_checkout.qual.node()) {
          // globalstore checkout registration
          // function to poll for existence of checkregister
          var pollForBody = function pollForBody(i) {
            if (i !== 10) {
              if (document.getElementsByTagName('body').length > 0) {
                // call checkRegister in setTimout because it renders after body
                window.setTimeout(function () {
                  _checkRegister();
                }, 500);
              } else {
                window.setTimeout(function () {
                  i++;
                  pollForBody(i);
                }, 500);
              }
            }
          };
          // creates click listener that generates doubleclicktag
          var _checkRegister = function _checkRegister() {
            if (document.getElementById('checkRegister')) {
              document.getElementById('checkRegister').addEventListener('click', function (e) {
                cat = 'coreg' + country_code;

                _neo.din(program.agents.buildImgSrc(construct, 'regconfm', cat), 'iframe', 'body');
              });
            }
          };

          pollForBody(0);
        } else if (sb.ocp_confirm.qual.node() || sb.gs_confirm.qual.node()) {
          // order confirmation
          // overdefensive wrapping so we don't get errors on confirmation.
          var orderData = void 0;

          if (_neo && _neo.ocp && _neo.ocp.data) {
            orderData = _neo.ocp.data();
          } else if (_neo && _neo.globalstore && _neo.globalstore.data) {
            orderData = _neo.globalstore.data();
          } else {
            return false;
          }
          cat = 'sales' + orderData.order_currency.toLowerCase();
          _neo.din(program.agents.buildImgSrc(construct, 'saleconf', cat), 'iframe', 'body');
        } else {
          return false;
        }
      }
    }
  }
});
_neo.neo();