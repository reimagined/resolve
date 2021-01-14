import { SagaMeta } from '../types'
import {
  SagaInterop,
  SagaInteropMap,
  SagaRuntime,
  SagasInteropBuilder,
  SchedulerInfo,
} from './types'
import { createHttpError, HttpStatusCodes } from '../errors'

const getSagaInterop = (
  saga: { name: string; connectorName: string },
  runtime: SagaRuntime
): SagaInterop => {
  const { name, connectorName } = saga
  return {
    name,
    connectorName,
    acquireResolver: () => {
      throw createHttpError(HttpStatusCodes.NotFound, ``)
    },
  }
}

export const getSagasInteropBuilder = (
  sagas: SagaMeta[],
  schedulers: SchedulerInfo[]
): SagasInteropBuilder => (runtime) => ({
  ...[...sagas, ...schedulers].reduce<SagaInteropMap>((map, model) => {
    map[model.name] = getSagaInterop(model, runtime)
    return map
  }, {}),
})
