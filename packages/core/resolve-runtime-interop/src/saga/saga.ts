import { createSchedulerAggregate } from './create-scheduler-aggregate'
import { SagaDomain, SchedulerInfo } from './types'
import { createSchedulersSagas } from './create-schedulers-sagas'

const schedulerName = '_SCHEDULER_'
const schedulerEventTypes = {
  SCHEDULED_COMMAND_CREATED: `_RESOLVE_SYS_SCHEDULED_COMMAND_CREATED_`,
  SCHEDULED_COMMAND_EXECUTED: `_RESOLVE_SYS_SCHEDULED_COMMAND_EXECUTED_`,
  SCHEDULED_COMMAND_SUCCEEDED: `_RESOLVE_SYS_SCHEDULED_COMMAND_SUCCEEDED_`,
  SCHEDULED_COMMAND_FAILED: `_RESOLVE_SYS_SCHEDULED_COMMAND_FAILED_`,
}
const schedulerInvariantHash = 'scheduler-invariant-hash' // FIXME: does it belongs to the package

const getSagasSchedulersInfo = (sagas: any[]): SchedulerInfo[] => {
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
  const appliedGetSagasSchedulerInfo = getSagasSchedulersInfo.bind(null, sagas)

  return {
    schedulerName,
    schedulerEventTypes,
    schedulerInvariantHash,
    getSagasSchedulersInfo: appliedGetSagasSchedulerInfo,
    createSchedulerAggregate: createSchedulerAggregate.bind(null, {
      schedulerName,
      schedulerEventTypes,
      schedulerInvariantHash,
    }),
    createSchedulersSagas: createSchedulersSagas.bind(null, {
      getSagasSchedulersInfo: appliedGetSagasSchedulerInfo,
      schedulerName,
      schedulerEventTypes,
    }),
  }
}
