var states = {
  PENDING: 1,
  FULFILLED: 2,
}

function MyPromise(executor) {
  var state = states.PENDING
  var value = undefined
  var callback = undefined
  function resolve(fulfilledValue) {
    value = fulfilledValue
    state = states.FULFILLED
    if (callback) callback(value)
  }
  executor(resolve)

  function then(givenCallback) {
    return new MyPromise(newResolve => {
      if (state === states.FULFILLED) {
        newResolve(givenCallback(value))
      } else {
        callback = function chainedCallback(fulfilledValue) {
          newResolve(givenCallback(fulfilledValue))
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

function xtest() {}

test('works with timeout', () => {
  var p = new MyPromise(resolve => setTimeout(() => resolve('value'), 300))
  p.then(value => expect(value).toEqual('value'))
})

test('works without timeout', () => {
  var p = new MyPromise(resolve => resolve('value'))
  p.then(value => {
    expect(value).toEqual('value')
  })
})

test('chainable directly', () =>
  new MyPromise(resolve => setTimeout(() => resolve('value'), 300))
    .then(value => {
      expect(value).toEqual('value')
      return 'first then'
    })
    .then(value => {
      expect(value).toEqual('first then')
      return 'second then'
    }))
