import { mocked } from 'ts-jest/utils'

import { SecretsManager, Event } from '../src/types/core'
import { ViewModelMeta, Eventstore, Monitoring } from '../src/types/runtime'
import { getViewModelsInteropBuilder } from '../src/view-model/get-view-models-interop-builder'
import {
  ViewModelBuildContext,
  ViewModelBuildParams,
  ViewModelBuildResult,
  ViewModelRuntime,
} from '../src/view-model/types'
import { StoredEvent } from '../types'

let monitoring: Monitoring

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

const makeTestRuntime = (events: Event[] = []): ViewModelRuntime => {
  const secretsManager: SecretsManager = {
    getSecret: jest.fn(),
    setSecret: jest.fn(),
    deleteSecret: jest.fn(),
  }

  const storedEvents = events.map<StoredEvent>((event) => ({
    ...event,
    threadId: 0,
    threadCounter: 0,
  }))

  const eventstore: Eventstore = {
    getReplicationState: jest.fn(),
    replicateEvents: jest.fn(),
    replicateSecrets: jest.fn(),
    resetReplication: jest.fn(),
    setReplicationIterator: jest.fn(),
    setReplicationPaused: jest.fn(),
    setReplicationStatus: jest.fn(),
    saveEvent: jest.fn(),
    getNextCursor: jest.fn(
      (currentCursor) =>
        (currentCursor && (Number(currentCursor) + 1).toString()) || '1'
    ),
    loadEvents: jest.fn(({ cursor, aggregateIds }) =>
      Promise.resolve({
        cursor: '',
        events: storedEvents.filter((e) =>
          aggregateIds?.includes(e.aggregateId)
        ),
      })
    ),
    loadSnapshot: jest.fn(),
    saveSnapshot: jest.fn(),
    ensureEventSubscriber: jest.fn().mockResolvedValue(null),
    removeEventSubscriber: jest.fn().mockResolvedValue(null),
    getEventSubscribers: jest.fn().mockResolvedValue([]),
  }

  monitoring = {
    error: jest.fn(),
    execution: jest.fn(),
    group: jest.fn(() => monitoring),
    time: jest.fn(),
    timeEnd: jest.fn(),
    publish: jest.fn(),
    duration: jest.fn(),
    rate: jest.fn(),
  }

  mocked(monitoring.group).mockReturnValue(monitoring)

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
    expect(cursor).toEqual('2')
  })

  test('collects error if event handler is failed', async () => {
    const error = new Error('TestError')

    const resolver = setUpTestViewModelResolver(
      {
        name: 'TestViewModel',
        projection: {
          Init: () => [],
          dummyEvent: () => {
            throw error
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

    try {
      await resolver({
        aggregateIds: ['validAggregateId'],
        aggregateArgs: null,
      })

      throw new Error('Building must be failed')
    } catch (e) {}

    expect(monitoring.group).toBeCalledWith({ Part: 'ViewModelProjection' })
    expect(monitoring.group).toBeCalledWith({ ViewModel: 'TestViewModel' })
    expect(monitoring.group).toBeCalledWith({ EventType: 'dummyEvent' })
    expect(monitoring.error).toBeCalledWith(error)
  })

  test('collects error if resolver is failed', async () => {
    const error = new Error('TestError')

    const resolver = setUpTestViewModelResolver(
      {
        name: 'TestViewModel',
        projection: {
          Init: () => [],
          dummyEvent: (state: any, event: any) => {
            return [...state, event.payload.text]
          },
        },
        resolver: () => {
          throw error
        },
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

    try {
      await resolver({
        aggregateIds: ['validAggregateId'],
        aggregateArgs: null,
      })

      throw new Error('Building must be failed')
    } catch (e) {}

    expect(monitoring.group).toBeCalledWith({ Part: 'ViewModelResolver' })
    expect(monitoring.group).toBeCalledWith({ ViewModel: 'TestViewModel' })
    expect(monitoring.execution).toBeCalledWith(error)
  })

  test('collects execution if resolver is not failed', async () => {
    const resolver = setUpTestViewModelResolver(
      {
        name: 'TestViewModel',
        projection: {
          Init: () => [],
          dummyEvent: (state: any, event: any) => {
            return [...state, event.payload.text]
          },
        },
        resolver: () => {
          return null
        },
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

    try {
      await resolver({
        aggregateIds: ['validAggregateId'],
        aggregateArgs: null,
      })

      throw new Error('Building must be failed')
    } catch (e) {}

    expect(monitoring.group).toBeCalledWith({ Part: 'ViewModelResolver' })
    expect(monitoring.group).toBeCalledWith({ ViewModel: 'TestViewModel' })
    expect(monitoring.execution).toBeCalledWith()
  })
})
