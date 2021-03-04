const RDSDataService = jest.fn()

const promised = (): Function =>
  jest.fn().mockReturnValue({ promise: () => Promise.resolve() })

RDSDataService.prototype.executeStatement = promised()

export default RDSDataService
