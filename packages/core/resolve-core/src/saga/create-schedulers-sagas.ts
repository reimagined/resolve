import { Event } from '../index'
import getLog from '../get-log'
import { createEventHandler } from './create-event-handler'
import {
  SagaHandlers,
  SchedulerEventTypes,
  SchedulerSideEffects,
  SchedulersSagasBuilder,
  SystemSideEffects,
} from './types'

const log = getLog('wrap-scheduler-sagas')

const createSchedulerSagaHandlers = ({
  schedulerAggregateName,
  commandsTableName,
  eventTypes: {
    SCHEDULED_COMMAND_CREATED,
    SCHEDULED_COMMAND_EXECUTED,
    SCHEDULED_COMMAND_SUCCEEDED,
    SCHEDULED_COMMAND_FAILED,
  },
}: {
  schedulerAggregateName: string
  commandsTableName: string
  eventTypes: SchedulerEventTypes
}): SagaHandlers<SchedulerSideEffects & SystemSideEffects> => ({
  Init: async ({ store }) => {
    await store.defineTable(commandsTableName, {
      indexes: { taskId: 'string', date: 'number' },
      fields: ['command'],
    })
  },
  Bootstrap: async ({ store, sideEffects }) => {
    await sideEffects.clearEntries()
    // BUGFIX: add ALL entries here
    await sideEffects.addEntries(store.find({ date: { $lte: Date.now() } }))
  },
  [SCHEDULED_COMMAND_CREATED]: async (
    { store, sideEffects },
    { aggregateId, payload: { date, command } }
  ) => {
    const log = getLog('scheduled-command-created')

    const entry = {
      taskId: aggregateId,
      date: Number(date),
      command,
    }

    log.debug(`adding entry ${aggregateId} to the store`)
    log.verbose(`entry: ${JSON.stringify(entry)}`)

    await store.insert(commandsTableName, entry)

    log.debug(`entry successfully added to the store`)
    log.debug(`calling adapter's addEntries with the entry`)

    await sideEffects.addEntries([entry])

    log.debug(`completed successfully`)
  },
  [SCHEDULED_COMMAND_EXECUTED]: async (
    { sideEffects: { executeCommand } },
    { aggregateId, payload: { command } }
  ) => {
    const log = getLog('scheduled-command-executed')
    try {
      log.debug(`executing the command`)
      log.verbose(`command: ${JSON.stringify(command)}`)

      await executeCommand(command)

      log.debug(`executing "success" scheduler command`)
      try {
        await executeCommand({
          aggregateId,
          aggregateName: schedulerAggregateName,
          type: 'success',
          payload: {},
        })
        log.debug(`completed successfully`)
      } catch (error) {
        log.debug(`cannot complete scheduled task: ${error.message}`)
      }
    } catch (error) {
      log.error(`error: ${error.message}`)
      log.debug(`executing "failure" scheduler command`)
      try {
        await executeCommand({
          aggregateId,
          aggregateName: schedulerAggregateName,
          type: 'failure',
          payload: {
            reason: error.stack,
          },
        })
      } catch (error) {
        log.debug(`cannot complete scheduled task: ${error.message}`)
      }
    }
  },
  [SCHEDULED_COMMAND_SUCCEEDED]: async ({ store }, { aggregateId }) => {
    const log = getLog('scheduled-command-succeeded')
    log.debug(`removing entry ${aggregateId} from the store`)
    await store.delete(commandsTableName, { taskId: aggregateId })
    log.debug(`completed successfully`)
  },
  [SCHEDULED_COMMAND_FAILED]: async ({ store }, { aggregateId }) => {
    const log = getLog('scheduled-command-failed')
    log.debug(`removing entry ${aggregateId} from the store`)
    await store.delete(commandsTableName, { taskId: aggregateId })
    log.debug(`completed successfully`)
  },
})

export const createSchedulersSagas: SchedulersSagasBuilder = (
  { schedulersInfo, schedulerName, schedulerEventTypes },
  runtime
): any[] =>
  schedulersInfo.map(({ name, connectorName }) => {
    const handlers = createSchedulerSagaHandlers({
      schedulerAggregateName: schedulerName,
      commandsTableName: schedulerName,
      eventTypes: schedulerEventTypes,
    })

    // FIXME: replace with read model handler type
    const projection = Object.keys(handlers).reduce<{
      [key: string]: (store: any, event: Event) => Promise<void>
    }>((acc, eventType) => {
      log.debug(
        `[wrap-sagas] registering system scheduler saga event handler ${eventType}`
      )
      acc[eventType] = createEventHandler(
        runtime,
        eventType,
        handlers[eventType],
        runtime.scheduler,
        () => {
          /* no op */
        }
      )

      return acc
    }, {})

    return {
      name,
      projection,
      resolvers: {},
      connectorName,
      encryption: () => Promise.resolve({}),
    }
  })
