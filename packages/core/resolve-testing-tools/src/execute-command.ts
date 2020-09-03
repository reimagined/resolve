import { SecretsManager, Event, SerializableMap } from 'resolve-core'
import { CommandExecutorBuilder, CommandExecutor } from 'resolve-command'
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
  secretsManager,
  events,
  aggregateId
}: BDDExecuteCommandState) => ({
  getNextCursor: () => Promise.resolve(null),
  saveSnapshot: () => Promise.resolve(),
  getSecretsManager: () => Promise.resolve(secretsManager),
  loadSnapshot: () => Promise.resolve(null),
  loadEvents: () =>
    Promise.resolve({
      events: transformEvents(events, 'aggregate', { aggregateId })
    })
})

const makeDummyPublisher = () => {
  const savedEvents: Event[] = []

  return async (event: Event) => {
    savedEvents.push(event)
  }
}

export const executeCommand = async (
  context: BDDExecuteCommandContext
): Promise<void> => {
  const {
    createCommand,
    promise: { [symbol]: state }
  } = context

  if (state.phase < Phases.COMMAND) {
    throw new TypeError(`unexpected phase`)
  }

  const { assertion, resolve, reject } = state
  let executor: CommandExecutor | null = null
  try {
    const onCommandExecuted = makeDummyPublisher()

    executor = createCommand({
      eventstoreAdapter: makeDummyEventStoreAdapter(state),
      onCommandExecuted,
      performanceTracer: null,
      aggregates: [
        {
          name: state.aggregate.name,
          projection: state.aggregate.projection,
          commands: state.aggregate.commands,
          encryption: state.aggregate.encryption || null,
          deserializeState: JSON.parse,
          serializeState: JSON.stringify,
          invariantHash: 'invariant-hash'
        }
      ]
    })

    const result = await executor({
      aggregateId: state.aggregateId,
      aggregateName: state.aggregate.name,
      type: state.command.name,
      payload: state.command.payload || {},
      jwt: state.jwt
    })

    const event: {
      type: string
      payload?: SerializableMap
    } = {
      type: result.type
    }

    if (Object.prototype.hasOwnProperty.call(result, 'payload')) {
      event['payload'] = result['payload']
    }

    assertion(resolve, reject, event, null)
  } catch (error) {
    assertion(resolve, reject, null, error)
  } finally {
    if (executor) {
      await executor.dispose()
    }
  }
}
