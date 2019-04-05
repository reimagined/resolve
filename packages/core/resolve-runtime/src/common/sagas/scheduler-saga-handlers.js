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
    const entry = {
      taskId: aggregateId,
      date: Number(date),
      command
    }

    resolveLog('debug', `[scheduler-saga:scheduled-command-created] adding entry to store`)
    await store.insert(commandsTableName, entry)

    resolveLog('debug', `[scheduler-saga:scheduled-command-created] calling adapter's addEntries`)
    await sideEffects.addEntries([entry])
  },
  [SCHEDULED_COMMAND_EXECUTED]: async (
    { executeCommand },
    { aggregateId, payload: { command } }
  ) => {
    try {
      await executeCommand(command)
      await executeCommand({
        aggregateId,
        aggregateName: schedulerAggregateName,
        type: 'success',
        payload: {}
      })
    } catch (error) {
      await executeCommand({
        aggregateId,
        aggregateName: schedulerAggregateName,
        type: 'failure',
        payload: {
          reason: error.stack
        }
      })
    }
  },
  [SCHEDULED_COMMAND_SUCCEEDED]: async ({ store }, { aggregateId }) => {
    await store.delete(commandsTableName, { taskId: aggregateId })
  },
  [SCHEDULED_COMMAND_FAILED]: async ({ store }, { aggregateId }) => {
    await store.delete(commandsTableName, { taskId: aggregateId })
  }
})
