var states = {
  PENDING: 1,
  FULFILLED: 2,
  REJECTED: 3,
}

function MyPromise(executor) {
  var state = states.PENDING
  var callbacks = []
  var alreadyBroadcasted = false
  var value = undefined
  var reason = undefined

  function resolve(valueToResolve) {
    if (state !== states.PENDING) return
    if (alreadyBroadcasted) return
    alreadyBroadcasted = true
    state = states.FULFILLED
    value = valueToResolve
    // then.6 - when a promise is fulfilled or rejected, execute onFulfilled callbacks
    // or onRejected callbacks in order of calls
    broadcast()
  }

  function reject(reasonToGive) {
    if (state !== states.PENDING) return
    if (alreadyBroadcasted) return
    alreadyBroadcasted = true
    state = states.REJECTED
    reason = reasonToGive
    // then.6 - when a promise is fulfilled or rejected, execute onFulfilled callbacks
    // or onRejected callbacks in order of calls
    broadcast()
  }

  function broadcast() {
    callbacks.forEach(function(callbackInterface) {
      var promise2Interface = callbackInterface.promiseInterface
      var onFulfilled = callbackInterface.onFulfilled
      var onRejected = callbackInterface.onRejected
      var promise1Interface = {
        value,
        reason,
        state,
      }
      // 2.4 - must not be called until execution context stack contains only
      // platform code
      setTimeout(function() {
        // 2.2.2.i - must be called after promise fulfilled
        if (state === states.FULFILLED)
          doResolve(promise1Interface, promise2Interface, onFulfilled)
        // 2.2.3.i - must be called after promise rejected
        else if (state === states.REJECTED)
          doReject(promise1Interface, promise2Interface, onRejected)
      })
    })
  }

  this.then = function then(onFulfilled, onRejected) {
    var promise2Interface = createPromise()
    var callbackInterface = {
      promiseInterface: promise2Interface,
      onFulfilled: onFulfilled,
      onRejected: onRejected,
    }
    if (state === states.FULFILLED || state === states.REJECTED) {
      var promise1Interface = {
        value,
        reason,
        state,
      }
      setTimeout(function() {
        // 2.2.2.i - must be called after promise fulfilled
        if (state === states.FULFILLED)
          doResolve(
            promise1Interface,
            promise2Interface,
            callbackInterface.onFulfilled
          )
        // 2.2.3.i - must be called after promise rejected
        else if (state === states.REJECTED)
          doReject(
            promise1Interface,
            promise2Interface,
            callbackInterface.onRejected
          )
      })
    } else {
      callbacks.push(callbackInterface)
    }
    // 2.7 must return a promise
    return promise2Interface.promise
  }

  executor(resolve, reject)
}

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

/*
 * Why do we need this again?
 */

function doResolve(promise1Interface, promise2Interface, onFulfilled) {
  if (!isFunction(onFulfilled)) {
    promise2Interface.fulfill(promise1Interface.value)
    return
  }
  try {
    var retVal = onFulfilled(promise1Interface.value)
    prp(promise2Interface, retVal)
  } catch (e) {
    promise2Interface.reject(e)
  }
}

/*
 * Why do we need this again?
 */

function doReject(promise1Interface, promise2Interface, onRejected) {
  if (!isFunction(onRejected)) {
    promise2Interface.reject(promise1Interface.reason)
    return
  }
  try {
    var retVal = onRejected(promise1Interface.reason)
    prp(promise2Interface, retVal)
  } catch (e) {
    promise2Interface.reject(e)
  }
}

function prp(promiseInterface, value) {
  if (promiseInterface.promise === value) {
    // 3.1 if equal, reject with TypeError
    promiseInterface.reject(new TypeError())
    return
  }

  if (value instanceof MyPromise) {
    // 3.2 if value is a Promise, adopt its state
    value.then(
      function resolve(resolvedValue) {
        // This shouldn't be a thenable
        // Actually, I think it's fine if this is a thenable.
        // It's more like we need to resolve it again.
        prp(promiseInterface, resolvedValue)
        // console.log(resolvedValue)
        // promiseInterface.fulfill(resolvedValue)
      },
      function reject(reason) {
        promiseInterface.reject(reason)
      }
    )
    return
  }

  if (!isObject(value) && !isFunction(value)) {
    // 3.4 if not an object or function, fulfill promise with value
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

  if (!isFunction(then)) {
    // 3.3.4 - if then is not a function, fulfill promise with value
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
        prp(promiseInterface, y)
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
