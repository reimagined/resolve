import { SagaDomain, SagaRuntime, SchedulerInfo } from './types'
import { createSchedulerAggregate } from './create-scheduler-aggregate'
import { createSchedulersSagas } from './create-schedulers-sagas'
import { createApplicationSagas } from './create-application-sagas'
import {
  schedulerEventTypes,
  schedulerInvariantHash,
  schedulerName,
} from './constants'

const createSagaInfoFetcher = (sagas: any[]) => (): SchedulerInfo[] => {
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
  const getSagasSchedulersInfo = createSagaInfoFetcher(sagas)

  const createSagas = (runtime: SagaRuntime) => [
    ...createSchedulersSagas(
      {
        schedulerName,
        schedulersInfo: getSagasSchedulersInfo(),
        schedulerEventTypes,
      },
      runtime
    ),
    ...createApplicationSagas({ sagas, schedulerName }, runtime),
  ]

  return {
    schedulerName,
    schedulerEventTypes,
    schedulerInvariantHash,
    getSagasSchedulersInfo,
    createSchedulerAggregate,
    createSagas,
  }
}
