const Lambda = jest.fn()

const promised = () =>
  jest.fn().mockReturnValue({ promise: () => Promise.resolve() })

Lambda.prototype.invoke = promised()

export default Lambda
