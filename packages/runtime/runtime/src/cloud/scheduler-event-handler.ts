import type { Resolve } from '../common/types'

import debugLevels from '@resolve-js/debug-levels'

const log = debugLevels('resolve:runtime:scheduler-event-handler')

const handleSchedulerEvent = async ({ entry }: any, resolve: Resolve) => {
  log.debug(`dispatching lambda event to all available schedulers`)
  if (
    resolve != null &&
    resolve.scheduler != null &&
    typeof resolve.scheduler.executeEntries === 'function'
  ) {
    return resolve.scheduler.executeEntries(entry)
  }

  log.warn(`no resolve.executeSaga.runScheduler property defined`)

  return { message: 'no registered sagas' }
}

export default handleSchedulerEvent
