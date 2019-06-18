var states = {
  PENDING: 1,
  FULFILLED: 2,
  REJECTED: 3,
}

function MyPromise(executor) {
  let state = states.PENDING
  let value = undefined
  let reason = undefined
  const callbacks = []

  const resolve = value => {
    if (state !== states.PENDING) return

    state = states.FULFILLED
    value = value
    // then.6 - when a promise is fulfilled or rejected, execute onFulfilled callbacks
    // or onRejected callbacks in order of calls
    while (callbacks.length > 0) {
      const callback = callbacks.pop()
      const { onFulfilled, onRejected } = callback
      try {
        // then.5 must be called as functions
        onFulfilled(value)
      } catch (e) {
        onRejected(e)
      }
    }
  }
  const reject = () => {}
  executor(resolve, reject)

  function then(onFulfilled, onRejected) {
    // then.6 if promise is fulfilled/rejected, execute callbacks
    const [callbackObj, newPromise] = createThen(
      onFulfilled,
      onRejected,
      state,
      callbacks
    )
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

  return {
    state,
    value,
    reason,
    then,
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
      if (typeof onFulfilled !== 'function') {
        // then.7.ii if onFulfilled is not a function and promise is fulfilled, resolve
        // with value
        newResolve(value)
        return
      }
      try {
        const value = onFulfilled(value)
        doResolve(newResolve, newReject, value)
      } catch (e) {
        newReject(e)
      }
    },
    onRejected: function wrappedOnRejected(reason) {
      // then.1 both onFulfilled and onRejected are optional arguments
      if (typeof onRejected !== 'function') {
        // then.7.iii if onRejected is not a function and promise is rejected, reject
        // with reason
        newReject(reason)
        return
      }
      try {
        const value = onRejected(reason)
        doResolve(newResolve, newReject, value)
      } catch (e) {
        newReject(e)
      }
    },
  }

  return [callbackObj, newPromise]
}

function doResolve(resolve, reject, value) {
  if (value instanceof MyPromise) {
    value.then(val => resolve(val), reason => reject(reason))
    return
  }

  if (typeof value !== 'object' && typeof value !== 'function') {
    resolve(value)
    return
  }

  let resolvePromiseCalled = false
  let rejectPromiseCalled = false

  try {
    const then = value.then
    if (typeof then !== 'function') {
      resolve(value)
      return
    }
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
    then.call(value, resolvePromise, rejectPromise)
  } catch (e) {
    if (resolvePromiseCalled || rejectPromiseCalled) return
    reject(e)
  }
}

export default MyPromise
