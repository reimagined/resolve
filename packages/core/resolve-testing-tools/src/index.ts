import createQuery from 'resolve-query'
import createCommand from 'resolve-command'
import { SerializableMap } from 'resolve-core'
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
import { CommandResult } from 'resolve-core'

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
  command
}) as (events: any[]) => GivenEventsContext

export const RESOLVE_SIDE_EFFECTS_START_TIMESTAMP =
  'RESOLVE_SIDE_EFFECTS_START_TIMESTAMP'

export interface GivenEventsContext {
  createQuery: any
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
