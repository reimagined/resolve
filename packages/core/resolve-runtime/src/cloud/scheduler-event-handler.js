import debugLevels from 'resolve-debug-levels'

const log = debugLevels('resolve:resolve-runtime:scheduler-event-handler')

const handleSchedulerEvent = async ({ entry }, resolve) => {
  log.debug(`dispatching lambda event to all available schedulers`)
  if (
    resolve != null &&
    resolve.executeSaga != null &&
    typeof resolve.executeSaga.runScheduler === 'function'
  ) {
    return resolve.executeSaga.runScheduler(entry)
  }

  log.warn(`no resolve.executeSaga.runScheduler property defined`)

  return { message: 'no registered sagas' }
}

export default handleSchedulerEvent
