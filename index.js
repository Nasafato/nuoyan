var states = {
  PENDING: 1,
  FULFILLED: 2,
  REJECTED: 3,
}

function MyPromise(executor) {
  this.state = states.PENDING
  this.callbacks = []
  this.alreadyBroadcasted = false

  this.broadcast = function broadcast() {
    this.callbacks.forEach(callback => {
      const { onFulfilled, onRejected } = callback
      try {
        if (this.state === states.FULFILLED) onFulfilled(this.value)
        else if (this.state === states.REJECTED) onRejected(this.reason)
      } catch (e) {
        onRejected(e)
      }
    })
  }.bind(this)

  const resolve = value => {
    if (this.state !== states.PENDING) return
    if (this.alreadyBroadcasted) return
    this.alreadyBroadcasted = true
    this.state = states.FULFILLED
    this.value = value
    // then.6 - when a promise is fulfilled or rejected, execute onFulfilled callbacks
    // or onRejected callbacks in order of calls
    this.broadcast()
  }
  const reject = reason => {
    if (this.state !== states.PENDING) return
    if (this.alreadyBroadcasted) return
    this.alreadyBroadcasted = true
    this.state = states.REJECTED
    this.reason = reason
    // then.6 - when a promise is fulfilled or rejected, execute onFulfilled callbacks
    // or onRejected callbacks in order of calls
    this.broadcast()
  }

  executor(resolve, reject)

  this.then = function then(onFulfilled, onRejected) {
    // then.6 if promise is fulfilled/rejected, execute callbacks
    const [callbackObj, newPromise] = createThen(onFulfilled, onRejected)
    if (this.state === states.FULFILLED) {
      callbackObj.onFulfilled.call(undefined, this.value)
    } else if (this.state === states.REJECTED) {
      // then.5 must be called as functions
      callbackObj.onRejected.call(undefined, this.reason)
    } else {
      // then.5 must be called as functions
      this.callbacks.push(callbackObj)
    }

    // then.7 must return a promise
    return newPromise
  }.bind(this)

  return {
    state: this.state,
    value: this.value,
    reason: this.reason,
    then: this.then,
  }
}

function createThen(onFulfilled, onRejected) {
  let newResolve, newReject
  const newPromise = new MyPromise((resolve, reject) => {
    newResolve = resolve
    newReject = reject
  })

  const callbackObj = {
    onFulfilled: function wrappedOnFulfilled(value) {
      // then.1 both onFulfilled and onRejected are optional arguments
      if (!isFunction(onFulfilled)) {
        // then.7.ii if onFulfilled is not a function and promise is fulfilled, resolve
        // with value
        newResolve(value)
        return
      }
      setTimeout(() => {
        try {
          const retValue = onFulfilled(value)
          doResolve(newResolve, newReject, retValue)
        } catch (e) {
          newReject(e)
        }
      })
    },
    onRejected: function wrappedOnRejected(reason) {
      // then.1 both onFulfilled and onRejected are optional arguments
      if (typeof onRejected !== 'function') {
        // then.7.iii if onRejected is not a function and promise is rejected, reject
        // with reason
        newReject(reason)
        return
      }
      setTimeout(() => {
        try {
          const value = onRejected(reason)
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
  if (value instanceof MyPromise) {
    value.then(val => resolve(val), reason => reject(reason))
    return
  }

  if (!isObject(value) && !isFunction(value)) {
    resolve(value)
    return
  }

  let resolvePromiseCalled = false
  let rejectPromiseCalled = false

  function resolvePromise(val) {
    if (resolvePromiseCalled || rejectPromiseCalled) return
    resolvePromiseCalled = true
    doResolve(resolve, reject, val)
  }

  function rejectPromise(r) {
    if (resolvePromiseCalled || rejectPromiseCalled) return
    rejectPromiseCalled = true
    reject(r)
  }

  try {
    const then = value.then
    if (!isFunction(then)) {
      resolve(value)
      return
    }

    then.call(value, resolvePromise, rejectPromise)
  } catch (e) {
    if (resolvePromiseCalled || rejectPromiseCalled) return
    reject(e)
  }
}

function isObject(value) {
  return typeof value === 'object'
}

function isFunction(value) {
  return typeof value === 'function'
}

module.exports = MyPromise
