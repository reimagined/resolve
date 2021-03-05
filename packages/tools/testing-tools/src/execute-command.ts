import {
  SecretsManager,
  Event,
  SerializableMap,
  initDomain,
} from '@resolve-js/core'
import { CommandExecutorBuilder, CommandExecutor } from '@resolve-js/runtime'
import { Phases, symbol } from './constants'
import { BDDAggregate } from './aggregate'
import transformEvents from './transform-events'
import { BDDAggregateAssertion } from './aggregate-assertions'

type BDDExecuteCommandState = {
  phase: Phases
  aggregate: BDDAggregate
  aggregateId: string
  secretsManager: SecretsManager
  events: Event[]
  command: {
    name: string
    payload: SerializableMap
    aggregateId: string
  }
  jwt?: string
  resolve: Function
  reject: Function
  assertion: BDDAggregateAssertion
}

type BDDExecuteCommandContext = {
  createCommand: CommandExecutorBuilder
  promise: {
    [symbol]: BDDExecuteCommandState
  }
}

const makeDummyEventStoreAdapter = ({
  events,
  aggregateId,
}: BDDExecuteCommandState) => {
  const savedEvents: Event[] = []

  return {
    getNextCursor: async () => Promise.resolve(null),
    saveSnapshot: async () => Promise.resolve(),
    loadSnapshot: async () => Promise.resolve(null),
    saveEvent: async (event: Event) => {
      savedEvents.push(event)
    },
    loadEvents: async () =>
      Promise.resolve({
        events: transformEvents(events, 'aggregate', { aggregateId }),
      }),
    ensureEventSubscriber: async () => Promise.resolve(),
    removeEventSubscriber: async () => Promise.resolve(),
    getEventSubscribers: async () => Promise.resolve([]),
  }
}

export const executeCommand = async (
  context: BDDExecuteCommandContext
): Promise<void> => {
  const {
    createCommand,
    promise: { [symbol]: state },
  } = context

  if (state.phase < Phases.COMMAND) {
    throw new TypeError(`unexpected phase`)
  }

  const domain = initDomain({
    viewModels: [],
    readModels: [],
    aggregates: [
      {
        name: state.aggregate.name,
        projection: state.aggregate.projection,
        commands: state.aggregate.commands,
        encryption: state.aggregate.encryption || null,
        deserializeState: JSON.parse,
        serializeState: JSON.stringify,
        invariantHash: 'invariant-hash',
      },
    ],
    sagas: [],
  })

  const { assertion, resolve, reject } = state
  let executor: CommandExecutor | null = null
  try {
    executor = createCommand({
      performanceTracer: null,
      aggregatesInterop: domain.aggregateDomain.acquireAggregatesInterop({
        eventstore: makeDummyEventStoreAdapter(state),
        secretsManager: state.secretsManager,
        monitoring: {},
        hooks: {},
      }),
    })

    const result = await executor({
      aggregateId: state.aggregateId,
      aggregateName: state.aggregate.name,
      type: state.command.name,
      payload: state.command.payload || {},
      jwt: state.jwt,
    })

    const event: {
      type: string
      payload?: SerializableMap
    } = {
      type: result.type,
    }

    if (Object.prototype.hasOwnProperty.call(result, 'payload')) {
      event['payload'] = result['payload']
    }

    return assertion(resolve, reject, event, null)
  } catch (error) {
    return assertion(resolve, reject, null, error)
  } finally {
    if (executor) {
      await executor.dispose()
    }
  }
}
