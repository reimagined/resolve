const STS = jest.fn()

STS.prototype.assumeRole = jest.fn()
STS.prototype.invoke = jest.fn()

export default STS
