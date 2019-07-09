export const result = []

const IotData = jest.fn().mockImplementation(function(...args) {
  result.push(['IotData constructor', ...args])
  this._publishPromiseResult = Promise.resolve()
})

IotData.prototype._toPublishPromise = jest
  .fn()
  .mockImplementation(function(...args) {
    result.push(['IotData publish.promise', ...args])

    return this._publishPromiseResult
  })

IotData.prototype.publish = jest.fn().mockImplementation(function(...args) {
  result.push(['IotData publish', ...args])

  return {
    promise: this._toPublishPromise.bind(this)
  }
})

export default IotData
