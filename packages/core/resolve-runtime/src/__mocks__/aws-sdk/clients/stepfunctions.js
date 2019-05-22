export const result = []

const StepFunctions = jest.fn().mockImplementation(function(...args) {
  result.push(['StepFunctions constructor', ...args])
  this._startExecutionPromiseResult = Promise.resolve()
})

StepFunctions.prototype._toStartExecutionPromise = jest
  .fn()
  .mockImplementation(function(...args) {
    result.push(['StepFunctions startExecution.promise', ...args])

    return this._startExecutionPromiseResult
  })

StepFunctions.prototype.startExecution = jest
  .fn()
  .mockImplementation(function(...args) {
    result.push(['StepFunctions startExecution', ...args])

    return {
      promise: this._toStartExecutionPromise.bind(this)
    }
  })

export default StepFunctions
