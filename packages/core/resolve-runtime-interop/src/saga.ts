type SchedulerInfo = {
  name: string
  connectorName: string
}

export type SagaDomain = {
  schedulerName: string
  schedulerEventTypes: { [key: string]: string }
  schedulerInvariantHash: string
  getSagasSchedulersInfo: () => SchedulerInfo[]
}

const schedulerName = '_SCHEDULER_'
const schedulerEventTypes = {
  SCHEDULED_COMMAND_CREATED: `_RESOLVE_SYS_SCHEDULED_COMMAND_CREATED_`,
  SCHEDULED_COMMAND_EXECUTED: `_RESOLVE_SYS_SCHEDULED_COMMAND_EXECUTED_`,
  SCHEDULED_COMMAND_SUCCEEDED: `_RESOLVE_SYS_SCHEDULED_COMMAND_SUCCEEDED_`,
  SCHEDULED_COMMAND_FAILED: `_RESOLVE_SYS_SCHEDULED_COMMAND_FAILED_`,
}
const schedulerInvariantHash = 'scheduler-invariant-hash' // FIXME: does it belongs to the package
const getSagasSchedulersInfo = (sagas: any[]) => {
  if (!Array.isArray(sagas)) {
    throw new Error(`Sagas ${sagas} is not array`)
  }

  return Array.from(new Set(sagas.map((saga) => saga.connectorName))).map(
    (connectorName) => ({
      name: schedulerName,
      connectorName,
    })
  )
}

export const initSagaDomain = (sagas: any[]): SagaDomain => {
  return {
    schedulerName,
    schedulerEventTypes,
    schedulerInvariantHash,
    getSagasSchedulersInfo: getSagasSchedulersInfo.bind(null, sagas),
  }
}
