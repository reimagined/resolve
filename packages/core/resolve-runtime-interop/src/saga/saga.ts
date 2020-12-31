import { SagaDomain, SagaRuntime, SchedulerInfo } from './types'
import { createSchedulerAggregate } from './create-scheduler-aggregate'
import { createSchedulersSagas } from './create-schedulers-sagas'
import { createApplicationSagas } from './create-application-sagas'
import { validateSaga } from './validate-saga'
import {
  schedulerEventTypes,
  schedulerInvariantHash,
  schedulerName,
} from './constants'
import { getSagasInteropBuilder } from './get-sagas-interop-builder'

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

export const initSagaDomain = (rawSagas: any[]): SagaDomain => {
  if (rawSagas == null) {
    throw Error(`invalid saga meta`)
  }

  const sagas = rawSagas.map(validateSaga)

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
    // FIXME: temporary, should split to event projections and resolvers interop
    acquireSagasInterop: getSagasInteropBuilder(sagas, getSagasSchedulersInfo()),
  }
}
