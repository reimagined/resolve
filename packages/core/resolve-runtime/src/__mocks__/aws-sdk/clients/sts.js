// export const result = []

const _STS = jest.fn().mockImplementation(() => STS)
const STS = _STS.bind(null)

STS.assumeRole = jest.fn()
STS.invoke = jest.fn()

Object.setPrototypeOf(STS, _STS)

// const STS = jest.fn().mockImplementation(function(...args) {
//   result.push(['STS constructor', ...args])
//   this._assumeRolePromiseResult = Promise.resolve()
// })
//
// STS.prototype._toAssumeRolePromise = jest
//   .fn()
//   .mockImplementation(function(...args) {
//     result.push(['STS assumeRole.promise', ...args])
//
//     return this._assumeRolePromiseResult
//   })
//
// STS.prototype.invoke = jest.fn().mockImplementation(function(...args) {
//   result.push(['STS invoke', ...args])
//
//   return {
//     promise: this._toAssumeRolePromise.bind(this)
//   }
// })

export default STS
