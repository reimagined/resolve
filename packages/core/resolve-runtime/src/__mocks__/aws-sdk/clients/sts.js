export const result = []

const STS = jest.fn().mockImplementation(function(...args) {
  result.push(['STS constructor', ...args])
  this._assumeRolePromiseResult = Promise.resolve()
})

STS.prototype._toAssumeRolePromise = jest
  .fn()
  .mockImplementation(function(...args) {
    result.push(['STS assumeRole.promise', ...args])

    return this._assumeRolePromiseResult
  })

STS.prototype.invoke = jest.fn().mockImplementation(function(...args) {
  result.push(['STS invoke', ...args])

  return {
    promise: this._toAssumeRolePromise.bind(this)
  }
})

export default STS
