import adapter from './adapter'

const dummy = { dummy: 'dummy' } // we fulfill or reject with this when we don't intend to test against it

jest.setTimeout(200)

describe("2.3.1: If `promise` and `x` refer to the same object, reject `promise` with a `TypeError' as the reason.", function() {
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
