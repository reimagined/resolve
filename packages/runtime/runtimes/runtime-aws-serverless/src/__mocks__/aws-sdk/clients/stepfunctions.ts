const StepFunctions = jest.fn()

const promised = () =>
  jest.fn().mockReturnValue({ promise: () => Promise.resolve() })

StepFunctions.prototype.startExecution = promised()

export default StepFunctions
