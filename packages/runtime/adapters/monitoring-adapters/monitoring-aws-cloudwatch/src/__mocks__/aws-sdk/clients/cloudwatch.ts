const CloudWatch = jest.fn()

CloudWatch.prototype.putMetricData = jest
  .fn()
  .mockReturnValue({ promise: () => Promise.resolve })

export default CloudWatch
