import adapter from './adapter'

const resolved = adapter.resolved
const rejected = adapter.rejected

const dummy = { dummy: 'dummy' } // we fulfill or reject with this when we don't intend to test against it
const sentinel = { sentinel: 'sentinel' } // a sentinel fulfillment value to test for with strict equality

jest.setTimeout(200)

describe('is a thenable for a thenable `y` is an already-fulfilled promise for a synchronously-fulfilled custom thenable `then` calls `resolvePromise` synchronously via return from a fulfilled promise:', () => {
  var outerStringRepresentation = 'an already-fulfilled promise'
  var outerThenableFactory = function(value) {
    return resolved(value)
  }
  var innerStringRepresentation = 'a synchronously-fulfilled custom thenable'
  var innerThenableFactory = function(value) {
    return {
      then: function(onFulfilled) {
        onFulfilled(value)
      },
    }
  }

  function yFactory() {
    // :100outerThenableFactory(innerThenableFactory(sentinel))
    // innerThenableFactory(sentinel)
    var innerThenable = {
      then: function(onFulfilled) {
        onFulfilled(sentinel)
      },
    }
    var outerThenable = resolved(innerThenable)
    // So the outer thenable returns an innerThenable that immediately fulfills
  }
  var yThenable = resolved({
    then: onFulfilled => {
      onFulfilled(sentinel)
    },
  })

  // testCallingResolvePromiseFulfillsWith(
  //   yFactory,
  //   stringRepresentation,
  //   sentinel
  // )
  const xFactory = () => ({
    then: function(resolvePromise) {
      resolvePromise(yThenable)
    },
  })
  function spec(promise, done) {
    promise.then(value => {
      expect(value).toBe(fulfillmentValue)
      done()
    })
  }
  const fulfillmentValue = sentinel
  test('via reutrn from a fulfilled promise', done => {
    // So we have a resolved promise
    // 1. We call then() with an onFulfilled that returns a thenable1
    // 2. thenable1's then method takes a function that it will call on another resolved promise, promise2
    // 3. promise2 has been resolved with a thenable that immediately fulfills with `sentinel`
    const promise = resolved(dummy).then(() => ({
      name: 'thenable1',
      then: resolvePromise => {
        resolvePromise(
          resolved({
            name: 'thenable1->1',
            then: onFulfilled => {
              onFulfilled(sentinel)
            },
          })
        )
      },
    }))
    // We are returning the final thenable instead of the value the thenable
    // gets fulfilled with. Promise2 should be fulfilled with the value that
    // Promise1 is fulfilled with
    // Actually, the reason is obvious, it's because I'm fulfilling the promise
    // with its executor's resolve function instead of doing the PRP on it.
    // If the value is an instance of a Promise, then... 
    // Actually, this means there's something wrong with my `then()` code if
    // the onFulfilled function isn't being resolved with the right
    //
    // The main problem is that a Promise is being fulfilled with a value, when the PRP should have run on that value and resolved it with an actual value
    const promise2 = promise.then(value => {
      console.log(value, fulfillmentValue)
      expect(value).toBe(fulfillmentValue)
      done()
    })
  })
})

function testCallingResolvePromiseFulfillsWith(
  yFactory,
  stringRepresentation,
  fulfillmentValue
) {
  testCallingResolvePromise(yFactory, stringRepresentation, function(
    promise,
    done
  ) {
    promise.then(function onPromiseFulfilled(value) {
      assert.strictEqual(value, fulfillmentValue)
      done()
    })
  })
}

function testCallingResolvePromise(yFactory, stringRepresentation, spec) {
  describe('`y` is ' + stringRepresentation, function() {
    describe('`then` calls `resolvePromise` synchronously', function() {
      function xFactory() {
        return {
          then: function(resolvePromise) {
            resolvePromise(yFactory())
          },
        }
      }

      testPromiseResolution(xFactory, spec)
    })

    describe('`then` calls `resolvePromise` asynchronously', function() {
      function xFactory() {
        return {
          then: function(resolvePromise) {
            setTimeout(function() {
              resolvePromise(yFactory())
            }, 0)
          },
        }
      }

      testPromiseResolution(xFactory, spec)
    })
  })
}

function testPromiseResolution(xFactory, spec) {
  test('via return from a fulfilled promise', function(done) {
    var promise = resolved(dummy).then(function onBasePromiseFulfilled() {
      return xFactory()
    })

    spec(promise, done)
  })

  test('via return from a rejected promise', function(done) {
    var promise = rejected(dummy).then(null, function onBasePromiseRejected() {
      return xFactory()
    })

    spec(promise, done)
  })
}
