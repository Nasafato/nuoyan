var states = {
  PENDING: 1,
  FULFILLED: 2,
  REJECTED: 3,
}

function MyPromise(executor) {
  var state = states.PENDING
  var value = undefined
  var resolveCallback = undefined
  var rejectCallback = undefined
  function resolve(fulfilledValue) {
    value = fulfilledValue
    state = states.FULFILLED
    if (resolveCallback) resolveCallback(value)
  }
  function reject(reason) {
    value = reason
    state = states.REJECTED
    if (rejectCallback) rejectCallback(value)
  }
  executor(resolve, reject)

  function then(givenResolve, givenReject) {
    return new MyPromise((newResolve, newReject) => {
      if (state === states.FULFILLED) {
        newResolve(givenResolve(value))
      } else if (state === states.REJECTED) {
        if (givenReject) newReject(givenReject(value))
      } else {
        resolveCallback = function resolveCallback(fulfilledValue) {
          newResolve(givenResolve(fulfilledValue))
        }
        if (givenReject)
          rejectCallback = function rejectCallback(reason) {
            newReject(givenReject(reason))
          }
      }
    })
  }

  return {
    then,
    state,
  }
}

function expect(value) {
  return {
    toEqual(targetValue) {
      if (targetValue !== value) {
        throw new Error(`Expected ${value} to equal ${targetValue}`)
      }
    },
  }
}

function test(name, callback) {
  console.log('Test: ' + name)
  try {
    const result = callback()
    if (result && result.then) {
      result.then(() => {
        console.log('\tSucceeded!')
      })
    } else {
      console.log('\tSucceeded!')
    }
  } catch (e) {
    console.log(e)
  }
}

export default MyPromise
