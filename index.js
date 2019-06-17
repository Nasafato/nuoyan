var states = {
  PENDING: 1,
  FULFILLED: 2,
  REJECTED: 3,
}

function createThen(callbacks, onFulfilled, onRejected) {
  let newResolve, newReject
  const newPromise = new MyPromise((resolve, reject) => {
    newResolve = resolve
    newReject = reject
  })

  callbacks.push({
    onFulfilled(value) {
      onFulfilled(value)
      newResolve(value)
    },
    onRejected(reason) {
      onRejected(reason)
      newReject(reason)
    },
  })
  return newPromise
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
    while (callbacks.length > 0) {
      const callback = callbacks.pop()
      try {
        callback.onFulfilled(value)
      } catch (e) {
        callback.onRejected(e)
      }
    }
  }
  const reject = () => {}
  executor(resolve, reject)

  function then(onFulfilled, onRejected) {
    return createThen(callbacks, onFulfilled, onRejected)
  }

  return {
    state,
    value,
    reason,
    then,
  }
}

export default MyPromise
