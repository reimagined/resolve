import { SecretsManager, Event } from '../src/types/core'
import { ViewModelMeta, Eventstore, Monitoring } from '../src/types/runtime'
import { getViewModelsInteropBuilder } from '../src/view-model/get-view-models-interop-builder'
import {
  ViewModelBuildContext,
  ViewModelBuildParams,
  ViewModelBuildResult,
  ViewModelRuntime,
} from '../src/view-model/types'

const dummyEncryption = () => Promise.resolve({})

const makeViewModelMeta = (params: any): ViewModelMeta[] => [
  {
    encryption: params.encryption || dummyEncryption,
    name: params.name || 'empty',
    invariantHash: params.invariantHash || 'empty-invariantHash',
    serializeState: params.serializeState || JSON.stringify,
    deserializeState: params.deserializeState || JSON.parse,
    projection: params.projection || {},
    resolver: params.resolver || jest.fn().mockReturnValue({}),
  },
]

const makeTestRuntime = (storedEvents: Event[] = []): ViewModelRuntime => {
  const secretsManager: SecretsManager = {
    getSecret: jest.fn(),
    setSecret: jest.fn(),
    deleteSecret: jest.fn(),
  }

  const eventstore: Eventstore = {
    saveEvent: jest.fn(),
    getNextCursor: jest.fn(
      (currentCursor) => (currentCursor && currentCursor + 1) || 1
    ),
    loadEvents: jest.fn(({ cursor, aggregateIds }) =>
      Promise.resolve({
        events: storedEvents.filter((e) =>
          aggregateIds.includes(e.aggregateId)
        ),
      })
    ),
    loadSnapshot: jest.fn(),
    saveSnapshot: jest.fn(),
    ensureEventSubscriber: jest.fn().mockResolvedValue(null),
    removeEventSubscriber: jest.fn().mockResolvedValue(null),
    getEventSubscribers: jest.fn().mockResolvedValue([]),
  }

  const monitoring: Monitoring = {
    error: jest.fn(),
  }

  return {
    eventstore,
    secretsManager,
    monitoring,
  }
}

const setUpTestViewModelResolver = (
  viewModel: { name: string; projection: any; resolver: Function },
  events: Event[]
) => async (
  params: ViewModelBuildParams,
  context?: ViewModelBuildContext
): Promise<ViewModelBuildResult> => {
  const viewModelInteropMap = getViewModelsInteropBuilder(
    makeViewModelMeta(viewModel)
  )(makeTestRuntime(events))
  const resolve = await viewModelInteropMap[viewModel.name].acquireResolver(
    params,
    context || {}
  )
  return resolve()
}

describe('View models', () => {
  test('should build state only for passed aggregateIds', async () => {
    const resolver = setUpTestViewModelResolver(
      {
        name: 'TestViewModel',
        projection: {
          Init: () => [],
          dummyEvent: (state: any, event: any) => {
            return [...state, event.payload.text]
          },
        },
        resolver: (resolve: any, params: any) =>
          resolve.buildViewModel('TestViewModel', params),
      },
      [
        {
          type: 'dummyEvent',
          payload: { text: 'first' },
          aggregateId: 'validAggregateId',
          aggregateVersion: 1,
          timestamp: 1,
        },
        {
          type: 'dummyEvent',
          payload: { text: 'second' },
          aggregateId: 'invalidAggregateId',
          aggregateVersion: 1,
          timestamp: 2,
        },
        {
          type: 'dummyEvent',
          payload: { text: 'third' },
          aggregateId: 'validAggregateId',
          aggregateVersion: 2,
          timestamp: 3,
        },
      ]
    )

    const { data, cursor, eventCount } = await resolver({
      aggregateIds: ['validAggregateId'],
      aggregateArgs: null,
    })
    expect(data).toEqual(['first', 'third'])
    expect(eventCount).toEqual(2)
    expect(cursor).toEqual(2)
  })
})
