const handleSchedulerEvent = async (lambdaEvent, resolve) => {
  resolveLog('debug', `dispatching lambda event to all available schedulers`)
  if (resolve && resolve.readModels) {
    return Promise.all(
      resolve.readModels
        .filter(readModel =>
          typeof readModel['schedulerAdapter'] === 'object' &&
          readModel['schedulerAdapter'] !== null
        )
        .map(readModel => readModel['schedulerAdapter'])
        .map(adapter => typeof adapter['handleExternalEvent'] === "function" ?
          adapter['handleExternalEvent'] : null)
        .filter(handler => handler !== null)
        .map(async (handler) => handler(lambdaEvent))
    )
  }
  resolveLog('warn', `no reSolve framework or no readModels property defined`)
  return { message: 'no registered sagas' }
}

export default handleSchedulerEvent
