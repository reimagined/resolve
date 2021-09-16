import type { Scheduler } from '../common/types'

import debugLevels from '@resolve-js/debug-levels'

const log = debugLevels('resolve:runtime:scheduler-event-handler')

export const handleSchedulerEvent = async (
  { entry }: any,
  scheduler: Scheduler
) => {
  log.debug(`dispatching lambda event to all available schedulers`)
  if (scheduler != null && typeof scheduler.executeEntries === 'function') {
    return scheduler.executeEntries(entry)
  }

  log.warn(`no resolve.executeSaga.runScheduler property defined`)

  return { message: 'no registered sagas' }
}
