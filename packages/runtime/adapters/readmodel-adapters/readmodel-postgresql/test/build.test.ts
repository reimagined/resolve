import { getNextCursor } from '@resolve-js/eventstore-base'
import {
  InlineLedgerRunQueryMethod,
  CheckEventsContinuityMethod,
  EventstoreAdapterLike,
  MethodGetRemainingTime,
  GenerateGuidMethod,
  ReadModelStoreImpl,
  ReadModelEvent,
  MethodNext,
  AdapterPool,
  BuildInfo,
  StoreApi,
} from '../src/types'
import PassthroughError from '../src/passthrough-error'
import escapeStr from '../src/escape-str'
import escapeId from '../src/escape-id'
import build from '../src/build'

const mocked = <F extends Function>(f: F) =>
  (f as unknown) as F extends (...args: infer A) => infer R
    ? jest.Mock<R, A>
    : never

describe('Build', () => {
  const getVacantTimeInMillis: MethodGetRemainingTime = () => 0x7fffffff
  const readModelName = 'readModelName'

  let generateGuid: GenerateGuidMethod = null!
  let inlineLedgerRunQuery: InlineLedgerRunQueryMethod = null!
  let checkEventsContinuity: CheckEventsContinuityMethod = null!
  let pool: AdapterPool = null!
  let store: ReadModelStoreImpl<AdapterPool, StoreApi<AdapterPool>> = null!
  let initHandler: () => Promise<void> = null!
  let eventHandler: () => Promise<void> = null!
  let modelInterop: {
    acquireInitHandler: (
      store: ReadModelStoreImpl<AdapterPool, StoreApi<AdapterPool>>
    ) => typeof initHandler
    acquireEventHandler: (
      store: ReadModelStoreImpl<AdapterPool, StoreApi<AdapterPool>>,
      event: ReadModelEvent
    ) => typeof eventHandler
  } = null!
  let getCursorUntilEventTypes: EventstoreAdapterLike['getCursorUntilEventTypes'] = null!
  let loadEvents: EventstoreAdapterLike['loadEvents'] = null!
  let eventstoreAdapter: EventstoreAdapterLike = null!
  let buildInfo: BuildInfo = null!
  let next: MethodNext = null!

  beforeEach(() => {
    inlineLedgerRunQuery = jest.fn()
    checkEventsContinuity = jest.fn().mockImplementation(async () => false)
    const stableGuid = new Map<any, any>()
    generateGuid = (...args) => {
      if (!stableGuid.has(args)) {
        stableGuid.set(args, `e${stableGuid.size}`)
      }
      return stableGuid.get(args)
    }

    pool = {
      tablePrefix: 'tablePrefix',
      schemaName: 'schemaName',
      activePassthrough: false,
      inlineLedgerRunQuery,
      PassthroughError,
      checkEventsContinuity,
      generateGuid,
      escapeStr,
      escapeId,
    } as typeof pool

    store = {} as typeof store

    initHandler = jest.fn()
    eventHandler = jest.fn()

    modelInterop = {
      acquireInitHandler: (
        store: ReadModelStoreImpl<AdapterPool, StoreApi<AdapterPool>>
      ) => initHandler,
      acquireEventHandler: (
        store: ReadModelStoreImpl<AdapterPool, StoreApi<AdapterPool>>,
        event: ReadModelEvent
      ) => eventHandler,
    }

    loadEvents = jest.fn()

    eventstoreAdapter = {
      get getCursorUntilEventTypes () { return getCursorUntilEventTypes },
      get getNextCursor () { return getNextCursor },
      get loadEvents () { return loadEvents },
    } as typeof eventstoreAdapter

    buildInfo = {
      initiator: 'read-model-next',
      notificationId: '0',
      sendTime: 0,
    }

    next = jest.fn()
  })

  afterEach(() => {
    generateGuid = null!
    inlineLedgerRunQuery = null!
    checkEventsContinuity = null!
    pool = null!
    store = null!
    initHandler = null!
    eventHandler = null!
    modelInterop = null!
    getCursorUntilEventTypes = null!
    loadEvents = null!
    eventstoreAdapter = null!
    buildInfo = null!
    next = null!
  })

  test('should throw Passthrough error on absent ledger', async () => {
    mocked(inlineLedgerRunQuery).mockResolvedValueOnce([])
    mocked(inlineLedgerRunQuery).mockResolvedValueOnce(null!)

    await build(
      pool,
      readModelName,
      store,
      modelInterop,
      next,
      eventstoreAdapter,
      getVacantTimeInMillis,
      buildInfo
    )

    expect(mocked(inlineLedgerRunQuery).mock.calls.length).toEqual(2)

    expect(mocked(inlineLedgerRunQuery).mock.calls[1][0]).toContain('ROLLBACK')
  })

  test('should throw Passthrough error on ledger with error read-model state', async () => {
    mocked(inlineLedgerRunQuery).mockResolvedValueOnce([{
      Errors: []
    }])
    mocked(inlineLedgerRunQuery).mockResolvedValueOnce(null!)

    await build(
      pool,
      readModelName,
      store,
      modelInterop,
      next,
      eventstoreAdapter,
      getVacantTimeInMillis,
      buildInfo
    )

    expect(mocked(inlineLedgerRunQuery).mock.calls.length).toEqual(2)

    expect(mocked(inlineLedgerRunQuery).mock.calls[1][0]).toContain('ROLLBACK')
  })

  test('should throw TypeError error on wrong EventTypes', async () => {
    mocked(inlineLedgerRunQuery).mockResolvedValueOnce([{
      EventTypes: 'WRONG_EVENT_TYPES'
    }])
    mocked(inlineLedgerRunQuery).mockResolvedValueOnce(null!)
    expect.assertions(2)
    try {
    await build(
      pool,
      readModelName,
      store,
      modelInterop,
      next,
      eventstoreAdapter,
      getVacantTimeInMillis,
      buildInfo
    )
    } catch(error) {
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toContain('eventTypes')
    }

  })

  test('should throw TypeError error on wrong Cursor', async () => {
    mocked(inlineLedgerRunQuery).mockResolvedValueOnce([{
      EventTypes: [],
      Cursor: 0
    }])
    mocked(inlineLedgerRunQuery).mockResolvedValueOnce(null!)
    expect.assertions(2)
    try {
    await build(
      pool,
      readModelName,
      store,
      modelInterop,
      next,
      eventstoreAdapter,
      getVacantTimeInMillis,
      buildInfo
    )
    } catch(error) {
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toContain('cursor')
    }

  })


  test('should perform success Init on ledger with null cursor and zero errors', async () => {
    mocked(inlineLedgerRunQuery).mockResolvedValueOnce([{
      EventTypes: ['FIRST_EVENT_TYPE', 'SECOND_EVENT_TYPE'],
      AggregateIds: null,
      Cursor: null,
      SuccessEvent: null,
      FailedEvent: null,
      Errors: null,
      Schema: null,
      IsPaused: false
    }])
    mocked(inlineLedgerRunQuery).mockResolvedValueOnce(null!)
    mocked(inlineLedgerRunQuery).mockResolvedValueOnce(null!)

    mocked(initHandler).mockResolvedValue(null!)

    await build(
      pool,
      readModelName,
      store,
      modelInterop,
      next,
      eventstoreAdapter,
      getVacantTimeInMillis,
      buildInfo
    )

    expect(mocked(inlineLedgerRunQuery).mock.calls.length).toEqual(3)

    expect(mocked(inlineLedgerRunQuery).mock.calls[2][0]).toContain('SuccessEvent')
  })

  test('should perform failed Init on ledger with null cursor and zero errors', async () => {
    mocked(inlineLedgerRunQuery).mockResolvedValueOnce([{
      EventTypes: ['FIRST_EVENT_TYPE', 'SECOND_EVENT_TYPE'],
      AggregateIds: null,
      Cursor: null,
      SuccessEvent: null,
      FailedEvent: null,
      Errors: null,
      Schema: null,
      IsPaused: false
    }])
    mocked(inlineLedgerRunQuery).mockResolvedValueOnce(null!)
    mocked(inlineLedgerRunQuery).mockResolvedValueOnce(null!)

    mocked(initHandler).mockRejectedValue(null!)

    await build(
      pool,
      readModelName,
      store,
      modelInterop,
      next,
      eventstoreAdapter,
      getVacantTimeInMillis,
      buildInfo
    )

    expect(mocked(inlineLedgerRunQuery).mock.calls.length).toEqual(3)

    expect(mocked(inlineLedgerRunQuery).mock.calls[2][0]).toContain('FailedEvent')
  })

  test('should perform failed Init with throw error', async () => {
    try {
      mocked(inlineLedgerRunQuery).mockResolvedValueOnce([{
        EventTypes: ['init'],
        AggregateIds: null,
        Cursor: null,
        SuccessEvent: null,
        FailedEvent: null,
        Errors: null,
        Schema: null,
        IsPaused: false
      }])
      mocked(inlineLedgerRunQuery).mockRejectedValue(new PassthroughError(true))
      mocked(inlineLedgerRunQuery).mockResolvedValueOnce(null!)

      await build(
        pool,
        readModelName,
        store,
        modelInterop,
        next,
        eventstoreAdapter,
        getVacantTimeInMillis,
        buildInfo
      )
      
    } catch (error) {
      expect(mocked(inlineLedgerRunQuery).mock.calls.length).toEqual(3)
      expect(mocked(inlineLedgerRunQuery).mock.calls[2][0]).toContain('ROLLBACK')
    }
  })

  test('should perform success non-plv8 Event handler on ledger with non-null cursor and zero errors', async () => {
    mocked(inlineLedgerRunQuery).mockResolvedValueOnce([{
      EventTypes: ['FIRST_EVENT_TYPE', 'SECOND_EVENT_TYPE'],
      AggregateIds: null,
      Cursor: getNextCursor(null, []),
      SuccessEvent: { type: 'Init' },
      FailedEvent: null,
      Errors: null,
      Schema: null,
      IsPaused: false
    }])
    mocked(inlineLedgerRunQuery).mockResolvedValueOnce(null!)
    mocked(inlineLedgerRunQuery).mockResolvedValueOnce(null!)

    const events: Array<ReadModelEvent> = [
      {threadId: 0, threadCounter: 0, type: 'FIRST_EVENT_TYPE', timestamp: 1, aggregateId: 'id', aggregateVersion: 1 },
      {threadId: 0, threadCounter: 1, type: 'SECOND_EVENT_TYPE', timestamp: 2, aggregateId: 'id', aggregateVersion: 2 },
      {threadId: 0, threadCounter: 2, type: 'FIRST_EVENT_TYPE', timestamp: 3, aggregateId: 'id', aggregateVersion: 3 }
    ]
    const expectedNextCursor = getNextCursor(getNextCursor(null, []), events)

    mocked(loadEvents).mockResolvedValueOnce({ events, cursor: null! })
    mocked(loadEvents).mockResolvedValueOnce({ events: [], cursor: null! })

    mocked(eventHandler).mockResolvedValue(null!)

    await build(
      pool,
      readModelName,
      store,
      modelInterop,
      next,
      eventstoreAdapter,
      getVacantTimeInMillis,
      buildInfo
    )

    expect(mocked(inlineLedgerRunQuery).mock.calls.length).toEqual(11)

    expect(mocked(inlineLedgerRunQuery).mock.calls[8][0]).toContain('SuccessEvent')

    expect(mocked(inlineLedgerRunQuery).mock.calls[8][0]).toContain(expectedNextCursor)
  })

  test('should perform success non-plv8 Event handler on ledger with non-null cursor and zero errors with time limit', async () => {
    mocked(inlineLedgerRunQuery).mockResolvedValueOnce([{
      EventTypes: ['FIRST_EVENT_TYPE', 'SECOND_EVENT_TYPE'],
      AggregateIds: null,
      Cursor: getNextCursor(null, []),
      SuccessEvent: { type: 'Init' },
      FailedEvent: null,
      Errors: null,
      Schema: null,
      IsPaused: false
    }])
    mocked(inlineLedgerRunQuery).mockResolvedValueOnce(null!)
    mocked(inlineLedgerRunQuery).mockResolvedValueOnce(null!)

    const events: Array<ReadModelEvent> = [
      {threadId: 0, threadCounter: 0, type: 'FIRST_EVENT_TYPE', timestamp: 1, aggregateId: 'id', aggregateVersion: 1 },
      {threadId: 0, threadCounter: 1, type: 'SECOND_EVENT_TYPE', timestamp: 2, aggregateId: 'id', aggregateVersion: 2 },
      {threadId: 0, threadCounter: 2, type: 'FIRST_EVENT_TYPE', timestamp: 3, aggregateId: 'id', aggregateVersion: 3 }
    ]
    const expectedNextCursor = getNextCursor(getNextCursor(null, []), [events[0]])

    mocked(loadEvents).mockResolvedValueOnce({ events, cursor: null! })
    mocked(loadEvents).mockResolvedValueOnce({ events: [], cursor: null! })

    mocked(eventHandler).mockResolvedValue(null!)

    const getVacantTimeInMillis: MethodGetRemainingTime = () => -0x7fffffff

    await build(
      pool,
      readModelName,
      store,
      modelInterop,
      next,
      eventstoreAdapter,
      getVacantTimeInMillis,
      buildInfo
    )

    expect(mocked(inlineLedgerRunQuery).mock.calls.length).toEqual(6)

    expect(mocked(inlineLedgerRunQuery).mock.calls[4][0]).toContain('SuccessEvent')

    expect(mocked(inlineLedgerRunQuery).mock.calls[4][0]).toContain(expectedNextCursor)
  })

  test('should perform success non-plv8 Event handler on ledger with non-null cursor and with throw passthrough error', async () => {
    try {
      mocked(inlineLedgerRunQuery).mockResolvedValueOnce([{
        EventTypes: ['FIRST_EVENT_TYPE', 'SECOND_EVENT_TYPE'],
        AggregateIds: null,
        Cursor: getNextCursor(null, []),
        SuccessEvent: { type: 'Init' },
        FailedEvent: null,
        Errors: null,
        Schema: null,
        IsPaused: false
      }])
      mocked(inlineLedgerRunQuery).mockRejectedValue(new PassthroughError(true))
      mocked(inlineLedgerRunQuery).mockResolvedValueOnce(null!)

      const events: Array<ReadModelEvent> = [
        {threadId: 0, threadCounter: 0, type: 'FIRST_EVENT_TYPE', timestamp: 1, aggregateId: 'id', aggregateVersion: 1 },
        {threadId: 0, threadCounter: 1, type: 'SECOND_EVENT_TYPE', timestamp: 2, aggregateId: 'id', aggregateVersion: 2 },
        {threadId: 0, threadCounter: 2, type: 'FIRST_EVENT_TYPE', timestamp: 3, aggregateId: 'id', aggregateVersion: 3 }
      ]

      mocked(loadEvents).mockResolvedValueOnce({ events, cursor: null! })
      mocked(loadEvents).mockResolvedValueOnce({ events: [], cursor: null! })

      mocked(eventHandler).mockResolvedValue(null!)

      const getVacantTimeInMillis: MethodGetRemainingTime = () => 0x7fffffff

      await build(
        pool,
        readModelName,
        store,
        modelInterop,
        next,
        eventstoreAdapter,
        getVacantTimeInMillis,
        buildInfo
      )
    } catch (error) {
      expect(mocked(inlineLedgerRunQuery).mock.calls.length).toEqual(1)

      expect(mocked(inlineLedgerRunQuery).mock.calls[0][0]).toContain('UpdateTrx')
    }    

  })

  test('should perform success non-plv8 Event handler on ledger with non-null cursor and with throw error', async () => {
    try {
      mocked(inlineLedgerRunQuery).mockResolvedValueOnce([{
        EventTypes: ['FIRST_EVENT_TYPE', 'SECOND_EVENT_TYPE'],
        AggregateIds: null,
        Cursor: getNextCursor(null, []),
        SuccessEvent: { type: 'Init' },
        FailedEvent: null,
        Errors: null,
        Schema: null,
        IsPaused: false
      }])
      mocked(inlineLedgerRunQuery).mockRejectedValue(new Error())
      mocked(inlineLedgerRunQuery).mockResolvedValueOnce(null!)

      const events: Array<ReadModelEvent> = [
        {threadId: 0, threadCounter: 0, type: 'FIRST_EVENT_TYPE', timestamp: 1, aggregateId: 'id', aggregateVersion: 1 },
        {threadId: 0, threadCounter: 1, type: 'SECOND_EVENT_TYPE', timestamp: 2, aggregateId: 'id', aggregateVersion: 2 },
        {threadId: 0, threadCounter: 2, type: 'FIRST_EVENT_TYPE', timestamp: 3, aggregateId: 'id', aggregateVersion: 3 }
      ]

      mocked(loadEvents).mockResolvedValueOnce({ events, cursor: null! })
      mocked(loadEvents).mockResolvedValueOnce({ events: [], cursor: null! })

      mocked(eventHandler).mockResolvedValue(null!)

      const getVacantTimeInMillis: MethodGetRemainingTime = () => 0x7fffffff

      await build(
        pool,
        readModelName,
        store,
        modelInterop,
        next,
        eventstoreAdapter,
        getVacantTimeInMillis,
        buildInfo
      )
    } catch (error) {
      expect(mocked(inlineLedgerRunQuery).mock.calls.length).toEqual(5)

      // expect(mocked(inlineLedgerRunQuery).mock.calls[0][0]).toContain('UpdateTrx')
    }    

  })

  test('should perform success non-plv8 Event handler on ledger with non-null cursor and with failed event', async () => {
    try {
      mocked(inlineLedgerRunQuery).mockResolvedValueOnce([{
        EventTypes: ['FIRST_EVENT_TYPE', 'SECOND_EVENT_TYPE'],
        AggregateIds: null,
        Cursor: getNextCursor(null, []),
        SuccessEvent: null,
        FailedEvent: null,
        Errors: null,
        Schema: null,
        IsPaused: false
      }])
      mocked(inlineLedgerRunQuery).mockRejectedValue(new Error())
      mocked(inlineLedgerRunQuery).mockResolvedValueOnce(null!)

      const events: Array<ReadModelEvent> = [
        {threadId: 0, threadCounter: 0, type: 'FIRST_EVENT_TYPE', timestamp: 1, aggregateId: 'id', aggregateVersion: 1 },
        {threadId: 0, threadCounter: 1, type: 'SECOND_EVENT_TYPE', timestamp: 2, aggregateId: 'id', aggregateVersion: 2 },
        {threadId: 0, threadCounter: 2, type: 'FIRST_EVENT_TYPE', timestamp: 3, aggregateId: 'id', aggregateVersion: 3 }
      ]

      mocked(loadEvents).mockResolvedValueOnce({ events, cursor: null! })
      mocked(initHandler).mockRejectedValue(new Error())
      // mocked(loadEvents).mockResolvedValueOnce({ events: [], cursor: null! })

      // mocked(eventHandler).mockResolvedValue(null!)

      const getVacantTimeInMillis: MethodGetRemainingTime = () => 0x7fffffff

      await build(
        pool,
        readModelName,
        store,
        modelInterop,
        next,
        eventstoreAdapter,
        getVacantTimeInMillis,
        buildInfo
      )
    } catch (error) {
      expect(mocked(inlineLedgerRunQuery).mock.calls.length).toEqual(5)

      // expect(mocked(inlineLedgerRunQuery).mock.calls[0][0]).toContain('UpdateTrx')
    }    

  })

})
