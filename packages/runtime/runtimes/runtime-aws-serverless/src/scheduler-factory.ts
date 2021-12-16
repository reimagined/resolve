import type {
  SchedulerEntry,
  Scheduler,
  Runtime,
} from '@resolve-js/runtime-base'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import interopRequireDefault from '@babel/runtime/helpers/interopRequireDefault'
import { maybeThrowErrors, errorBoundary } from 'resolve-cloud-common/utils'

import { getLog } from './scheduler-logger'
import { start } from './scheduler-start'
import { stopAll } from './scheduler-stop-all'

const errorHandler = async (error: any) => {
  throw error
}

const isEmpty = (obj: any) =>
  Object.keys(obj).reduce(
    (empty, key) => empty && !obj.hasOwnProperty(key),
    true
  )

const validateEntry = ({ date, taskId, command }: SchedulerEntry) =>
  date != null &&
  date.constructor === Number &&
  taskId != null &&
  taskId.constructor === String &&
  command != null &&
  command.constructor === Object &&
  !isEmpty(command)

export const schedulerFactory = (
  runtime: Runtime,
  schedulerName: string
): Scheduler => {
  getLog('createAdapter').debug(`building new resolve cloud scheduler adapter`)
  return {
    async addEntries(data) {
      const log = getLog('addEntries')

      log.debug(`adding new scheduled entries`)
      log.verbose(`data: ${JSON.stringify(data)}`)

      const entries = ([] as SchedulerEntry[]).concat(data)
      try {
        log.debug(`starting step function executions`)
        const errors: Array<Error> = []
        await Promise.all(
          entries.map((entry) =>
            (validateEntry(entry)
              ? start(entry)
              : errorHandler(Error(`invalid entry ${JSON.stringify(entry)}`))
            ).catch(errorBoundary(errors))
          )
        )
        maybeThrowErrors(errors)
        log.debug(`entries were successfully added`)
      } catch (e) {
        log.error(e.message)
        await errorHandler(e)
      }
    },
    async clearEntries() {
      const log = getLog('clearEntries')

      log.debug(`step functions cannot be recreated, skipping clearing`)

      await stopAll()
    },
    async executeEntries(data) {
      const log = getLog('executingEntries')

      log.debug(`executing scheduled entries`)
      log.verbose(`data: ${JSON.stringify(data)}`)

      const entries = ([] as SchedulerEntry[]).concat(data)

      try {
        log.debug(`executing tasks`)
        const errors: Array<Error> = []
        await Promise.all(
          entries.map(({ taskId, date, command }) =>
            runtime
              .executeSchedulerCommand({
                aggregateName: schedulerName,
                aggregateId: taskId,
                type: 'execute',
                payload: { date, command },
              })
              .catch(errorBoundary(errors))
          )
        )
        maybeThrowErrors(errors)
        log.debug(`tasks were successfully executed`)
      } catch (e) {
        log.error(e.message)
        await errorHandler(e)
      }
    },
  }
}
