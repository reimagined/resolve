let lambdaResult = null
export function setLambdaResult(value) {
  lambdaResult = value
}

export const result = []

const Lambda = jest.fn().mockImplementation(function (...args) {
  result.push(['Lambda constructor', ...args])
  this._invokePromiseResult = Promise.resolve({
    FunctionError: null,
    Payload: JSON.stringify(lambdaResult),
  })
})

Lambda.prototype._toInvokePromise = jest
  .fn()
  .mockImplementation(function (...args) {
    result.push(['Lambda invoke.promise', ...args])

    return this._invokePromiseResult
  })

Lambda.prototype.invoke = jest.fn().mockImplementation(function (...args) {
  result.push(['Lambda invoke', ...args])

  return {
    promise: this._toInvokePromise.bind(this),
  }
})

export default Lambda
