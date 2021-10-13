const CloudWatch = jest.fn()

const promised = () =>
  jest.fn().mockReturnValue({ promise: () => Promise.resolve() })

CloudWatch.prototype.putMetricData = promised()

export default CloudWatch
