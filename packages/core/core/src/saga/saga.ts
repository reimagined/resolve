import { SagaDomain, SchedulerInfo } from './types'
import { createSchedulerAggregate } from './create-scheduler-aggregate'
import { validateSaga } from './validate-saga'
import {
  schedulerEventTypes,
  schedulerInvariantHash,
  schedulerName,
} from './constants'
import { getSagasInteropBuilder } from './get-sagas-interop-builder'
import { getAggregatesInteropBuilder } from '../aggregate/get-aggregates-interop-builder'

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

  return {
    schedulerName,
    schedulerEventTypes,
    schedulerInvariantHash,
    getSagasSchedulersInfo,
    acquireSchedulerAggregatesInterop: getAggregatesInteropBuilder([
      createSchedulerAggregate(),
    ]),
    acquireSagasInterop: getSagasInteropBuilder(
      schedulerName,
      schedulerEventTypes,
      sagas,
      getSagasSchedulersInfo()
    ),
  }
}
