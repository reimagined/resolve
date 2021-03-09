import {
  createQuery,
  createCommand,
  CreateQueryOptions,
} from '@resolve-js/runtime'
import { SerializableMap, CommandResult } from '@resolve-js/core'
import as from './as'
import givenEvents from './given-events'
import { execute } from './execute'
import readModel, { ReadModelParams } from './read-model'
import transformEvents from './transform-events'
import { executeReadModel } from './execute-read-model'
import { executeSaga } from './execute-saga'
import { executeCommand } from './execute-command'
import saga, { SagaParams } from './saga'
import properties from './properties'
import getDefaultSecretsManager from './secrets-manager'
import setSecretsManager from './set-secrets-manager'
import { aggregate, BDDAggregate } from './aggregate'
import { command } from './command'

export { BDDAggregate }

export default givenEvents.bind(null, {
  createQuery,
  createCommand,
  as,
  execute,
  executeSaga,
  executeReadModel,
  executeCommand,
  readModel,
  transformEvents,
  saga,
  properties,
  getDefaultSecretsManager,
  setSecretsManager,
  aggregate,
  command,
}) as (events: any[]) => GivenEventsContext

export const RESOLVE_SIDE_EFFECTS_START_TIMESTAMP =
  'RESOLVE_SIDE_EFFECTS_START_TIMESTAMP'

export const schedulerName = '_SCHEDULER_'

export const getSchedulersNamesBySagas = (sagas: any): any => {
  if (!Array.isArray(sagas)) {
    throw new Error(`Sagas ${sagas} is not array`)
  }
  const uniqueSagaConnectorsNames: any = Array.from(
    new Set(sagas.map((saga) => saga.connectorName))
  )
  const schedulersNames = []
  for (const connectorName of uniqueSagaConnectorsNames) {
    // eslint-disable-next-line no-new-wrappers
    const currentSchedulerName: any = new String(
      `${schedulerName}${connectorName}`
    )
    currentSchedulerName.connectorName = connectorName
    schedulersNames.push(currentSchedulerName)
  }

  return schedulersNames
}

export interface GivenEventsContext {
  all: any
  createQuery: (params: CreateQueryOptions) => any
  createCommand: any
  as: (jwt: any) => GivenEventsContext
  readModel: (params: ReadModelParams) => GivenEventsContext
  transformEvents: any
  saga: (params: SagaParams) => GivenEventsContext
  properties: (sagaPropertied: any) => GivenEventsContext
  getDefaultSecretsManager: any
  setSecretsManager: any
  aggregate: (
    aggregate: BDDAggregate,
    aggregateId?: string
  ) => GivenEventsContext
  command: (name: string, payload?: SerializableMap) => GivenEventsContext
  shouldProduceEvent: (expectedEvent: CommandResult) => GivenEventsContext
  shouldThrow: (expectedError: any) => GivenEventsContext
}
