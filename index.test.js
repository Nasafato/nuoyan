import MyPromise from './index'

// https://github.com/promises-aplus/promises-tests/blob/master/lib/tests/2.1.2.js

jest.setTimeout(500)

const deferred = () => {
  let resolveFn
  let rejectFn
  const promise = new MyPromise((resolve, reject) => {
    resolveFn = resolve
    rejectFn = reject
  })

  return {
    resolve: resolveFn,
    reject: rejectFn,
    promise,
  }
}

const resolved = value => {
  const d = deferred()
  d.resolve(value)
  return d.promise
}

describe('when fulfilled, a promise must not transition to another state', () => {
  test('fulfill, then reject - neither onFulfilled nor onRejected should be called', done => {
    const promise = resolved('value')

    let onFulfilledCalled = false
    promise.then(
      function onFulfilled(value) {
        onFulfilledCalled = true
      },
      function onRejected(reason) {
        expect(onFulfilledCalled).toBe(false)
        done()
      }
    )

    setTimeout(() => {
      done()
    }, 100)
  })

  test('immediately fulfilled', done => {
    let d = deferred()

    let onFulfilledCalled = false
    d.promise.then(
      function onFulfilled(value) {
        onFulfilledCalled = true
      },
      function onRejected(reason) {
        expect(onFulfilledCalled).toBe(false)
        done()
      }
    )

    setTimeout(done, 100)
    d.resolve('value')
  })

  test('eventually fulfilled', done => {
    let d = deferred()

    let onFulfilledCalled = false
    d.promise.then(
      function onFulfilled(value) {
        onFulfilledCalled = true
      },
      function onRejected(reason) {
        expect(onFulfilledCalled).toBe(false)
        done()
      }
    )
    setTimeout(done, 100)
    setTimeout(() => {
      d.resolve('value')
    }, 50)
  })
})

describe.skip('old tests', () => {
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

  test.skip('then reject works', () =>
    new MyPromise((resolve, reject) =>
      setTimeout(() => reject('reason'), 300)
    ).then(
      value => {
        return 'first then'
      },
      reason => {
        expect(reason).toEqual('reason')
      }
    ))
})
