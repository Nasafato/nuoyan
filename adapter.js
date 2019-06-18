const MyPromise = require('./index')

function Adapter() {
  this.deferred = function deferred() {
    let savedResolve, savedReject
    const promise = new MyPromise((resolve, reject) => {
      savedResolve = resolve
      savedReject = reject
    })
    return {
      resolve: savedResolve,
      reject: savedReject,
      promise,
    }
  }.bind(this)

  this.resolved = function resolved(value) {
    const d = this.deferred()
    d.resolve(value)
    return d.promise
  }.bind(this)

  this.rejected = function rejected(value) {
    const d = this.deferred()
    d.reject(value)
    return d.promise
  }.bind(this)
}

// global.adapter = new Adapter()
module.exports = new Adapter()
