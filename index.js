var states = {
  PENDING: 1,
  FULFILLED: 2,
  REJECTED: 3,
}

function MyPromise(executor) {
  var state = states.PENDING
  var callbacks = []
  var value = undefined
  var reason = undefined

  function resolve(valueToResolve) {
    // 2.2.iii - onFulfilled must not be called more than once
    if (state !== states.PENDING) return
    state = states.FULFILLED
    value = valueToResolve
    broadcast()
  }

  function reject(reasonToGive) {
    // 2.3.iii - onRejected must not be called more than once
    if (state !== states.PENDING) return
    state = states.REJECTED
    reason = reasonToGive
    broadcast()
  }

  function broadcast() {
    callbacks.forEach(function(callbackInterface) {
      var promise2Interface = callbackInterface.promiseInterface
      var promise1Interface = {
        value,
        reason,
        state,
      }
      runCallbacks(promise1Interface, promise2Interface, callbackInterface)
    })
  }

  this.then = function then(onFulfilled, onRejected) {
    var promise2Interface = createPromise()
    var callbackInterface = {
      promiseInterface: promise2Interface,
      onFulfilled: onFulfilled,
      onRejected: onRejected,
    }
    if (state !== states.PENDING) {
      var promise1Interface = {
        value: value,
        reason: reason,
        state: state,
      }
      runCallbacks(promise1Interface, promise2Interface, callbackInterface)
    } else {
      callbacks.push(callbackInterface)
    }
    // 2.7 must return a promise
    return promise2Interface.promise
  }

  executor(resolve, reject)
}

function runCallbacks(
  basePromiseInterface,
  returnedPromiseInterface,
  callbacks
) {
  // 2.4 - must not be called until execution context stack contains only
  // platform code
  setTimeout(function() {
    // 2.2.2.i - must be called after promise fulfilled
    if (basePromiseInterface.state === states.FULFILLED)
      doResolve(
        basePromiseInterface,
        returnedPromiseInterface,
        callbacks.onFulfilled
      )
    // 2.2.3.i - must be called after promise rejected
    else if (basePromiseInterface.state === states.REJECTED)
      doReject(
        basePromiseInterface,
        returnedPromiseInterface,
        callbacks.onRejected
      )
  })
}

/**
 * Creates a promise and wraps it with an interface containing methods for
 * resolving or rejecting the promise.
 *
 * Used inside the `promiseResolutionProcedure` function.
 *
 * @returns {object} promiseInterface
 */
function createPromise() {
  var resolve, reject
  var newPromise = new MyPromise(function executor(
    internalResolve,
    internalReject
  ) {
    resolve = internalResolve
    reject = internalReject
  })

  return { promise: newPromise, fulfill: resolve, reject: reject }
}

/**
 * Resolves the value of promise 2, given the onFulfilled from calling
 * `promise1.then()`
 *
 * @param {object} promise1Interface
 * @param {object} promise2Interface
 * @param {any} onFulfilled
 */
function doResolve(promise1Interface, promise2Interface, onFulfilled) {
  // 2.1.i - if onFulfilled is not a function, it must be ignored
  if (!isFunction(onFulfilled)) {
    promise2Interface.fulfill(promise1Interface.value)
    return
  }
  try {
    var retVal = onFulfilled(promise1Interface.value)
    promiseResolutionProcedure(promise2Interface, retVal)
  } catch (e) {
    promise2Interface.reject(e)
  }
}

/**
 * Resolves the value of promise 2, given the onRejected from calling
 * `promise1.then()`
 *
 * @param {object} promise1Interface
 * @param {object} promise2Interface
 * @param {any} onRejected
 */
function doReject(promise1Interface, promise2Interface, onRejected) {
  // 2.1.ii - if onRejected is not a function, it must be ignored
  if (!isFunction(onRejected)) {
    promise2Interface.reject(promise1Interface.reason)
    return
  }
  try {
    var retVal = onRejected(promise1Interface.reason)
    promiseResolutionProcedure(promise2Interface, retVal)
  } catch (e) {
    promise2Interface.reject(e)
  }
}

/**
 * Runs the promise resolution procedure on a promise and some value.
 *
 * @param {object} promiseInterface
 * @param {any} value
 */
function promiseResolutionProcedure(promiseInterface, value) {
  // 3.1 if equal, reject with TypeError
  if (promiseInterface.promise === value) {
    promiseInterface.reject(new TypeError())
    return
  }

  // 3.2 if value is a Promise, adopt its state
  if (value instanceof MyPromise) {
    value.then(
      function resolve(resolvedValue) {
        promiseResolutionProcedure(promiseInterface, resolvedValue)
      },
      function reject(reason) {
        promiseInterface.reject(reason)
      }
    )
    return
  }

  // 3.4 if not an object or function, fulfill promise with value
  if (!isObject(value) && !isFunction(value)) {
    promiseInterface.fulfill(value)
    return
  }

  // 3.3 if value is an object or a function
  try {
    var then = value.then
  } catch (e) {
    // 3.3.2 - if retrieving then throws exception, reject with exception
    promiseInterface.reject(e)
    return
  }

  // 3.3.4 - if then is not a function, fulfill promise with value
  if (!isFunction(then)) {
    promiseInterface.fulfill(value)
    return
  }

  var promiseNoLongerPending = false
  try {
    then.call(
      value,
      function resolvePromise(y) {
        // 3.3.3.c - if both resolve/rejectPromise called, take first call and
        // ignore others
        if (promiseNoLongerPending) return
        promiseNoLongerPending = true
        promiseResolutionProcedure(promiseInterface, y)
      },
      function rejectPromise(r) {
        if (promiseNoLongerPending) return
        promiseNoLongerPending = true
        // 3.3.3.b - reject promise with reason r
        promiseInterface.reject(r)
      }
    )
  } catch (e) {
    // 3.3.3.d - if calling then throws an error e, reject promise with reason
    // e if neither resolve/rejectPromise have been called
    if (!promiseNoLongerPending) {
      promiseInterface.reject(e)
    }
  }
}

function isObject(value) {
  return value !== null && typeof value === 'object'
}

function isFunction(value) {
  return typeof value === 'function'
}

module.exports = MyPromise
