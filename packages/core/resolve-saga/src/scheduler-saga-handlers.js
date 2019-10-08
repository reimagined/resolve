import debugLevels from 'resolve-debug-levels'

const getLog = handler =>
  debugLevels(`resolve:resolve-runtime:scheduler-saga-handlers:${handler}`)

export default ({
  schedulerAggregateName,
  commandsTableName,
  eventTypes: {
    SCHEDULED_COMMAND_CREATED,
    SCHEDULED_COMMAND_EXECUTED,
    SCHEDULED_COMMAND_SUCCEEDED,
    SCHEDULED_COMMAND_FAILED
  }
}) => ({
  Init: async ({ store }) => {
    await store.defineTable(commandsTableName, {
      indexes: { taskId: 'string', date: 'number' },
      fields: ['command']
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
      command
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
          payload: {}
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
            reason: error.stack
          }
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
  }
})
