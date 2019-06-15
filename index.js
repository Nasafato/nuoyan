const states = {
  PENDING: 1,
  FULFILLED: 2,
}

function Promise(executor) {
  let state = states.PENDING
  let value = undefined
  let callbacks = []
  let resolve = function resolve(fulfilledValue) {
    value = fulfilledValue
    state = states.FULFILLED
    if (callbacks.length > 0) callbacks.pop()(value)
  }
  executor(resolve)

  let then = function then(callback) {
    if (state === states.FULFILLED) {
      callback(value)
    } else {
      callbacks.push(callback)
    }
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
    callback()
    console.log('\tSucceeded!')
  } catch (e) {
    console.log(e)
  }
}

function xtest() {}

test('works with timeout', () => {
  let p = new Promise(resolve => setTimeout(() => resolve('value'), 300))
  p.then(value => expect(value).toEqual('value'))
})

test('works without timeout', () => {
  let p = new Promise(resolve => resolve('value'))
  p.then(value => {
    expect(value).toEqual('value')
  })
})
