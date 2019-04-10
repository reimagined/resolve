const handleSchedulerEvent = async ({ entry }, resolve) => {
  resolveLog('debug', `dispatching lambda event to all available schedulers`)
  if (resolve && resolve.readModels) {
    return Promise.all(
      resolve.readModels
        .filter(
          readModel =>
            typeof readModel['schedulerAdapter'] === 'object' &&
            readModel['schedulerAdapter'] !== null
        )
        .map(readModel => readModel['schedulerAdapter'])
        .map(adapter =>
          typeof adapter['executeEntries'] === 'function'
            ? adapter['executeEntries']
            : null
        )
        .filter(handler => handler !== null)
        .map(async handler => handler(entry))
    )
  }
  resolveLog('warn', `no reSolve framework or no readModels property defined`)
  return { message: 'no registered sagas' }
}

export default handleSchedulerEvent
