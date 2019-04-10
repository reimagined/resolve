function StepFunctions() {}

const wrap = () =>
  jest.fn().mockReturnValue({ promise: () => Promise.resolve() })

StepFunctions.prototype.startExecution = wrap()
StepFunctions.prototype.stopExecution = wrap()
StepFunctions.prototype.listExecutions = wrap()

export default StepFunctions
