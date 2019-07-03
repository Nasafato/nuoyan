import adapter from './adapter'
const resolved = adapter.resolved;
const rejected = adapter.rejected;

const dummy = { dummy: 'dummy' } // we fulfill or reject with this when we don't intend to test against it

jest.setTimeout(200)

describe("Both `onFulfilled` and `onRejected` are optional arguments.", function() {
  test('via return from a fulfilled promise', function(done) {
    var promise = adapter.resolved(dummy).then(function() {
      return promise
    })

    promise.then(null, function(reason) {
      expect(reason instanceof TypeError).toBe(true)
      done()
    })
  })

  test('via return from a rejected promise', function(done) {
    var promise = adapter.rejected(dummy).then(null, function() {
      return promise
    })

    promise.then(null, function(reason) {
      expect(reason instanceof TypeError).toBe(true)
      done()
    })
  })
})

describe("2.2.1.2: If `onRejected` is not a function, it must be ignored.", function () {
  describe("applied to a directly-fulfilled promise", function () {
    function testNonFunction(nonFunction, stringRepresentation) {
      test("`onRejected` is " + stringRepresentation, function (done) {
        resolved(dummy).then(function () {
          done();
        }, nonFunction);
      });
    }

    testNonFunction(undefined, "`undefined`");
    testNonFunction(null, "`null`");
    testNonFunction(false, "`false`");
    testNonFunction(5, "`5`");
    testNonFunction({}, "an object");
  });

  describe("applied to a promise fulfilled and then chained off of", function () {
    function testNonFunction(nonFunction, stringRepresentation) {
        test("`onRejected` is " + stringRepresentation, function (done) {
            resolved(dummy).then(undefined, function () { }).then(function () {
                done();
            }, nonFunction);
        });
    }
    test('something', (done) => {
      resolved(dummy).then(undefined, function () {}).then(function() { done(); }, false)
    })

    testNonFunction(undefined, "`undefined`");
    testNonFunction(null, "`null`");
    testNonFunction(false, "`false`");
    testNonFunction(5, "`5`");
    testNonFunction({}, "an object");
  });
});
