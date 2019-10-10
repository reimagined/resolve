const _CloudWatch = jest.fn().mockImplementation(() => CloudWatch)
const CloudWatch = _CloudWatch.bind(null)
CloudWatch.putMetricData = jest
  .fn()
  .mockReturnValue({ promise: () => Promise.resolve() })

Object.setPrototypeOf(CloudWatch, _CloudWatch)

export default CloudWatch
