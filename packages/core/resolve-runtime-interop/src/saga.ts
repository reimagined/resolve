export type SagaDomain = {
  schedulerName: string
  schedulerEventTypes: { [key: string]: string }
  schedulerInvariantHash: string
  getSchedulersNamesBySagas: () => any[]
}

const schedulerName = '_SCHEDULER_'
const schedulerEventTypes = {
  SCHEDULED_COMMAND_CREATED: `_RESOLVE_SYS_SCHEDULED_COMMAND_CREATED_`,
  SCHEDULED_COMMAND_EXECUTED: `_RESOLVE_SYS_SCHEDULED_COMMAND_EXECUTED_`,
  SCHEDULED_COMMAND_SUCCEEDED: `_RESOLVE_SYS_SCHEDULED_COMMAND_SUCCEEDED_`,
  SCHEDULED_COMMAND_FAILED: `_RESOLVE_SYS_SCHEDULED_COMMAND_FAILED_`,
}
const schedulerInvariantHash = 'scheduler-invariant-hash' // FIXME: does it belongs to the package
const getSchedulersNamesBySagas = (sagas: any) => {
  if (!Array.isArray(sagas)) {
    throw new Error(`Sagas ${sagas} is not array`)
  }
  const uniqueSagaConnectorsNames = Array.from(
    new Set(sagas.map((saga) => saga.connectorName))
  )
  const schedulersNames = []
  for (const connectorName of uniqueSagaConnectorsNames) {
    // eslint-disable-next-line no-new-wrappers
    const currentSchedulerName = new String(
      `${schedulerName}${connectorName}`
    ) as any
    currentSchedulerName.connectorName = connectorName
    schedulersNames.push(currentSchedulerName)
  }

  return schedulersNames
}

export const initSagaDomain = (sagas: any[]): SagaDomain => {
  return {
    schedulerName,
    schedulerEventTypes,
    schedulerInvariantHash,
    getSchedulersNamesBySagas: getSchedulersNamesBySagas.bind(null, sagas),
  }
}
