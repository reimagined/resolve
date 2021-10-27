import { getLog } from '@resolve-js/runtime-base'

import type { Scheduler } from '@resolve-js/runtime-base'

const log = getLog('scheduler-event-handler')

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
