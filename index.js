var states = {
  PENDING: 1,
  FULFILLED: 2,
  REJECTED: 3,
}

function MyPromise(executor) {
  var state = states.PENDING
  var callbacks = []
  var alreadyBroadcasted = false
  var value, reason

  function broadcast() {
    callbacks.forEach(function(callback) {
      var { onFulfilled, onRejected } = callback
      try {
        if (state === states.FULFILLED) onFulfilled(value)
        else if (state === states.REJECTED) onRejected(reason)
      } catch (e) {
        onRejected(e)
      }
    })
  }

  var resolve = function(valueToResolve) {
    if (state !== states.PENDING) return
    if (alreadyBroadcasted) return
    alreadyBroadcasted = true
    state = states.FULFILLED
    value = valueToResolve
    // then.6 - when a promise is fulfilled or rejected, execute onFulfilled callbacks
    // or onRejected callbacks in order of calls
    broadcast()
  }

  var reject = function(reasonToGive) {
    if (state !== states.PENDING) return
    if (alreadyBroadcasted) return
    alreadyBroadcasted = true
    state = states.REJECTED
    reason = reasonToGive
    // then.6 - when a promise is fulfilled or rejected, execute onFulfilled callbacks
    // or onRejected callbacks in order of calls
    broadcast()
  }

  executor(resolve, reject)

  this.then = function then(onFulfilled, onRejected) {
    // then.6 if promise is fulfilled/rejected, execute callbacks
    var [callbackObj, newPromise] = createThen(onFulfilled, onRejected)
    if (state === states.FULFILLED) {
      callbackObj.onFulfilled.call(undefined, value)
    } else if (state === states.REJECTED) {
      // then.5 must be called as functions
      callbackObj.onRejected.call(undefined, reason)
    } else {
      // then.5 must be called as functions
      callbacks.push(callbackObj)
    }

    // then.7 must return a promise
    return newPromise
  }
}

function createThen(onFulfilled, onRejected) {
  var newResolve, newReject
  var newPromise = new MyPromise(function executor(resolve, reject) {
    newResolve = resolve
    newReject = reject
  })

  var callbackObj = {
    onFulfilled: function wrappedOnFulfilled(value) {
      // then.1 both onFulfilled and onRejected are optional arguments
      if (!isFunction(onFulfilled)) {
        // then.7.ii if onFulfilled is not a function and promise is fulfilled, resolve
        // with value
        newResolve(value)
        return
      }
      setTimeout(function() {
        try {
          var retValue = onFulfilled(value)
          doResolve(newResolve, newReject, retValue)
        } catch (e) {
          newReject(e)
        }
      })
    },
    onRejected: function wrappedOnRejected(reason) {
      // then.1 both onFulfilled and onRejected are optional arguments
      if (!isFunction(onFulfilled)) {
        // then.7.iii if onRejected is not a function and promise is rejected, reject
        // with reason
        newReject(reason)
        return
      }
      setTimeout(function() {
        try {
          var value = onRejected(reason)
          doResolve(newResolve, newReject, value)
        } catch (e) {
          newReject(e)
        }
      })
    },
  }

  return [callbackObj, newPromise]
}
/**
 * doResolve runs the Promise Resolution Procedure (PRP) detailed in the spec.
 *
 * @param {function} resolve - fulfills the Promise with a certain value
 * @param {function} reject - rejects the Promise with a certain reason
 * @param {*} value - any value
 */
function doResolve(resolve, reject, value) {
  if (this === value) {
    reject(new TypeError())
    return
  }

  // 3.2
  if (value instanceof MyPromise) {
    // 3.2.i
    value.then(
      // 3.2.ii
      function(val) { resolve(val)},
      // 3.2.iii
      function(reason) {reject(reason)}
    )
    return
  }

  // 3.4
  if (!isObject(value) && !isFunction(value)) {
    resolve(value)
    return
  }

  // 3.3
  var resolvePromiseCalled = false
  var rejectPromiseCalled = false

  try {
    // 3.3.i
    var then = value.then
    // 3.3.iv
    if (!isFunction(then)) {
      resolve(value)
      return
    }

    // 3.3.iii
    then.call(
      value,
      function resolvePromise(val) {
        // 3.3.iii.c
        if (resolvePromiseCalled || rejectPromiseCalled) return
        resolvePromiseCalled = true
        // 3.3.iii.a
        doResolve(resolve, reject, val)
      },
      function rejectPromise(r) {
        // 3.3.iii.c
        if (resolvePromiseCalled || rejectPromiseCalled) return
        rejectPromiseCalled = true
        // 3.3.iii.b
        reject(r)
      }
    )
  } catch (e) {
    // 3.3.iii.d
    if (resolvePromiseCalled || rejectPromiseCalled) return
    // 3.3.ii
    reject(e)
  }
}

function isObject(value) {
  return value !== null && typeof value === 'object'
}

function isFunction(value) {
  return typeof value === 'function'
}

module.exports = MyPromise
