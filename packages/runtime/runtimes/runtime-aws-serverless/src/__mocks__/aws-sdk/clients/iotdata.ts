const IotData = jest.fn()

const promised = () =>
  jest.fn().mockReturnValue({ promise: () => Promise.resolve() })

IotData.prototype.publish = promised()

export default IotData
