
var assert = require('assert')
var thenables = require('./helpers/thenables')

var adapter = global.adapter
var resolved = adapter.resolved
var rejected = adapter.rejected

var dummy = { dummy: 'dummy' } // we fulfill or reject with this when we don't intend to test against it
var sentinel = { sentinel: 'sentinel' } // a sentinel fulfillment value to test for with strict equality
var sentinelArray = [sentinel] // a sentinel fulfillment value to test when we need an array

function testPromiseResolution(xFactory, test) {
  test('via return from a fulfilled promise', function(done) {
    var promise = resolved(dummy).then(function onBasePromiseFulfilled() {
      return xFactory()
    })

    test(promise, done)
  })

  test('via return from a rejected promise', function(done) {
    var promise = rejected(dummy).then(null, function onBasePromiseRejected() {
      return xFactory()
    })

    test(promise, done)
  })
}

function testCallingResolvePromise(yFactory, stringRepresentation, test) {
  describe('`y` is ' + stringRepresentation, function() {
    describe('`then` calls `resolvePromise` synchronously', function() {
      function xFactory() {
        return {
          then: function(resolvePromise) {
            resolvePromise(yFactory())
          },
        }
      }

      testPromiseResolution(xFactory, test)
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

      testPromiseResolution(xFactory, test)
    })
  })
}

function testCallingRejectPromise(r, stringRepresentation, test) {
  describe('`r` is ' + stringRepresentation, function() {
    describe('`then` calls `rejectPromise` synchronously', function() {
      function xFactory() {
        return {
          then: function(resolvePromise, rejectPromise) {
            rejectPromise(r)
          },
        }
      }

      testPromiseResolution(xFactory, test)
    })

    describe('`then` calls `rejectPromise` asynchronously', function() {
      function xFactory() {
        return {
          then: function(resolvePromise, rejectPromise) {
            setTimeout(function() {
              rejectPromise(r)
            }, 0)
          },
        }
      }

      testPromiseResolution(xFactory, test)
    })
  })
}

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

function testCallingResolvePromiseRejectsWith(
  yFactory,
  stringRepresentation,
  rejectionReason
) {
  testCallingResolvePromise(yFactory, stringRepresentation, function(
    promise,
    done
  ) {
    promise.then(null, function onPromiseRejected(reason) {
      assert.strictEqual(reason, rejectionReason)
      done()
    })
  })
}

function testCallingRejectPromiseRejectsWith(reason, stringRepresentation) {
  testCallingRejectPromise(reason, stringRepresentation, function(
    promise,
    done
  ) {
    promise.then(null, function onPromiseRejected(rejectionReason) {
      assert.strictEqual(rejectionReason, reason)
      done()
    })
  })
}

describe('2.3.3: Otherwise, if `x` is an object or function,', function() {
  describe(
    '2.3.3.3: If `then` is a function, call it with `x` as `this`, first argument `resolvePromise`, and ' +
      'second argument `rejectPromise`',
    function() {
      describe.only('2.3.3.3.1: If/when `resolvePromise` is called with value `y`, run `[[Resolve]](promise, y)`', function() {
        describe('`y` is not a thenable', function() {
          testCallingResolvePromiseFulfillsWith(
            function() {
              return undefined
            },

            '`undefined`',
            undefined
          )
          testCallingResolvePromiseFulfillsWith(
            function() {
              return null
            },
            '`null`',
            null
          )
          testCallingResolvePromiseFulfillsWith(
            function() {
              return false
            },
            '`false`',
            false
          )
          testCallingResolvePromiseFulfillsWith(
            function() {
              return 5
            },
            '`5`',
            5
          )
          testCallingResolvePromiseFulfillsWith(
            function() {
              return sentinel
            },
            'an object',
            sentinel
          )
          testCallingResolvePromiseFulfillsWith(
            function() {
              return sentinelArray
            },
            'an array',
            sentinelArray
          )
        })

        describe('`y` is a thenable', function() {
          Object.keys(thenables.fulfilled).forEach(function(
            stringRepresentation
          ) {
            function yFactory() {
              return thenables.fulfilled[stringRepresentation](sentinel)
            }

            testCallingResolvePromiseFulfillsWith(
              yFactory,
              stringRepresentation,
              sentinel
            )
          })

          Object.keys(thenables.rejected).forEach(function(
            stringRepresentation
          ) {
            function yFactory() {
              return thenables.rejected[stringRepresentation](sentinel)
            }

            testCallingResolvePromiseRejectsWith(
              yFactory,
              stringRepresentation,
              sentinel
            )
          })
        })

        describe('test,' function() {
          var outerStringRepresentation = 'an already-fulfilled promise'
          var outerThenableFactory = function(value) { return resolved(value) }
          var innerThenableFactory = function(value) {
            return {
              then: function(onFulfilled) {
                onFulfilled(value)
              }
            }
          }

          function yFactory() {
            outerThenableFactory(innerThenableFactory(sentinel))
          }

          testCallingResolvePromiseFulfillsWith(
            yFactory,
            stringRepresentation,
            sentinel
          )
        }),
        describe('`y` is a thenable for a thenable', function() {
          Object.keys(thenables.fulfilled).forEach(function(
            outerStringRepresentation
          ) {
            var outerThenableFactory =
              thenables.fulfilled[outerStringRepresentation]

            Object.keys(thenables.fulfilled).forEach(function(
              innerStringRepresentation
            ) {
              var innerThenableFactory =
                thenables.fulfilled[innerStringRepresentation]

              var stringRepresentation =
                outerStringRepresentation + ' for ' + innerStringRepresentation

              function yFactory() {
                return outerThenableFactory(innerThenableFactory(sentinel))
              }

              testCallingResolvePromiseFulfillsWith(
                yFactory,
                stringRepresentation,
                sentinel
              )
            })

            Object.keys(thenables.rejected).forEach(function(
              innerStringRepresentation
            ) {
              var innerThenableFactory =
                thenables.rejected[innerStringRepresentation]

              var stringRepresentation =
                outerStringRepresentation + ' for ' + innerStringRepresentation

              function yFactory() {
                return outerThenableFactory(innerThenableFactory(sentinel))
              }

              testCallingResolvePromiseRejectsWith(
                yFactory,
                stringRepresentation,
                sentinel
              )
            })
          })
        })
      })
    })
})

