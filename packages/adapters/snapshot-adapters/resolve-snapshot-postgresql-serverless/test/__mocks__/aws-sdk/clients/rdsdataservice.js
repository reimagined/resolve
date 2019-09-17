const RDSDataService = function() {}

RDSDataService.prototype.beginTransaction = jest.fn()
RDSDataService.prototype.commitTransaction = jest.fn()
RDSDataService.prototype.rollbackTransaction = jest.fn()
RDSDataService.prototype.executeStatement = jest.fn()

export default RDSDataService
