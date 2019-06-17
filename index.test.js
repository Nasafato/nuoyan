import MyPromise from './index'

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
