import { mocked } from 'ts-jest/utils'

import status from '../src/status'

import type {
  AdapterPool,
  EventStoreAdapterLike,
  InlineLedgerRunQueryMethod,
  ReadModelLedger,
} from '../src/types'

import PassthroughError from '../src/passthrough-error'

let pool: AdapterPool
let originalDateNow: typeof Date.now
let eventstoreAdapter: EventStoreAdapterLike

beforeEach(() => {
  pool = {
    PassthroughError,
    inlineLedgerRunQuery: jest
      .fn()
      .mockReturnValue([]) as InlineLedgerRunQueryMethod,
    schemaName: 'test-schema',
    tablePrefix: 'test-table-prefix',
    escapeId: (str: string) => str,
    escapeStr: (str: string) => str,
  } as AdapterPool

  eventstoreAdapter = ({
    getCursorUntilEventTypes: jest.fn().mockResolvedValue('test-cursor'),
  } as unknown) as EventStoreAdapterLike

  originalDateNow = Date.now
  Date.now = jest.fn().mockReturnValue(0)
})

afterEach(() => {
  Date.now = originalDateNow
})

const createTestReadModelLedgerRow = ({
  EventTypes = ['test-event'],
  AggregateIds = ['test-aggregate'],
  Cursor = 'test-cursor',
  SuccessEvent = null,
  FailedEvent = null,
  Errors = null,
  Schema = null,
  IsPaused = false,
}: Partial<ReadModelLedger> = {}): ReadModelLedger => ({
  EventTypes,
  AggregateIds,
  Cursor,
  SuccessEvent,
  FailedEvent,
  Errors,
  Schema,
  IsPaused,
})

describe('isAlive', () => {
  test('returns true if ledger is not locked and there are no new events', async () => {
    mocked(Date.now).mockReturnValueOnce(0).mockReturnValueOnce(30000)

    mocked(pool.inlineLedgerRunQuery)
      .mockResolvedValueOnce([
        createTestReadModelLedgerRow({
          Cursor: 'test-cursor',
        }),
      ])
      .mockResolvedValueOnce([{ ActiveLocksCount: 0 }])
      .mockResolvedValueOnce([
        createTestReadModelLedgerRow({
          Cursor: 'test-cursor',
        }),
      ])

    mocked(eventstoreAdapter.getCursorUntilEventTypes)
      .mockResolvedValueOnce('test-cursor')
      .mockResolvedValueOnce('test-cursor')

    expect(
      await status(pool, 'test-read-model', eventstoreAdapter, true)
    ).toEqual(
      expect.objectContaining({
        isAlive: true,
      })
    )

    expect(
      eventstoreAdapter.getCursorUntilEventTypes
    ).toBeCalledWith('test-cursor', ['test-event'])

    expect(
      eventstoreAdapter.getCursorUntilEventTypes
    ).toBeCalledWith('test-cursor', ['*'])
  })

  test('returns true if ledger is locked', async () => {
    mocked(eventstoreAdapter.getCursorUntilEventTypes)
      .mockResolvedValueOnce('test-cursor-1')
      .mockResolvedValueOnce('test-cursor-2')
      .mockResolvedValueOnce('test-cursor-3')

    mocked(pool.inlineLedgerRunQuery)
      .mockResolvedValueOnce([createTestReadModelLedgerRow()])
      .mockResolvedValueOnce([{ ActiveLocksCount: 1 }])
      .mockResolvedValueOnce([
        createTestReadModelLedgerRow({
          Cursor: 'test-cursor',
        }),
      ])

    expect(
      await status(pool, 'test-read-model', eventstoreAdapter, true)
    ).toEqual(
      expect.objectContaining({
        isAlive: true,
      })
    )

    expect(eventstoreAdapter.getCursorUntilEventTypes).not.toBeCalled()
  })

  test('returns true if ledger had been locked while execution', async () => {
    mocked(eventstoreAdapter.getCursorUntilEventTypes)
      .mockResolvedValueOnce('test-cursor-1')
      .mockResolvedValueOnce('test-cursor-2')
      .mockResolvedValueOnce('test-cursor-3')

    mocked(pool.inlineLedgerRunQuery)
      .mockResolvedValueOnce([
        createTestReadModelLedgerRow({
          Cursor: 'test-cursor',
        }),
      ])
      .mockResolvedValueOnce([{ ActiveLocksCount: 0 }])
      .mockResolvedValueOnce([
        createTestReadModelLedgerRow({
          Cursor: 'test-cursor',
        }),
      ])
      .mockResolvedValueOnce([{ ActiveLocksCount: 1 }])
      .mockResolvedValueOnce([
        createTestReadModelLedgerRow({
          Cursor: 'test-cursor',
        }),
      ])

    expect(
      await status(pool, 'test-read-model', eventstoreAdapter, true)
    ).toEqual(
      expect.objectContaining({
        isAlive: true,
      })
    )
  })

  test('returns true if ledger is in skip status', async () => {
    mocked(eventstoreAdapter.getCursorUntilEventTypes)
      .mockResolvedValueOnce('test-cursor-1')
      .mockResolvedValueOnce('test-cursor-2')
      .mockResolvedValueOnce('test-cursor-3')

    mocked(pool.inlineLedgerRunQuery).mockResolvedValueOnce([
      createTestReadModelLedgerRow({
        IsPaused: true,
      }),
    ])

    expect(
      await status(pool, 'test-read-model', eventstoreAdapter, true)
    ).toEqual(
      expect.objectContaining({
        isAlive: true,
      })
    )
  })

  test('returns false if ledger is in error status', async () => {
    mocked(eventstoreAdapter.getCursorUntilEventTypes)
      .mockResolvedValueOnce('test-cursor-1')
      .mockResolvedValueOnce('test-cursor-2')
      .mockResolvedValueOnce('test-cursor-3')

    mocked(pool.inlineLedgerRunQuery).mockResolvedValueOnce([
      createTestReadModelLedgerRow({
        Errors: [{} as Error],
      }),
    ])

    expect(
      await status(pool, 'test-read-model', eventstoreAdapter, true)
    ).toEqual(
      expect.objectContaining({
        isAlive: false,
      })
    )
  })

  test('returns false if ledger is not locked and there are new events', async () => {
    mocked(Date.now).mockReturnValueOnce(0).mockReturnValueOnce(30000)

    mocked(eventstoreAdapter.getCursorUntilEventTypes)
      .mockResolvedValueOnce('test-cursor-2')
      .mockResolvedValueOnce('test-cursor-3')

    mocked(pool.inlineLedgerRunQuery)
      .mockResolvedValueOnce([
        createTestReadModelLedgerRow({
          Cursor: 'test-cursor-1',
        }),
      ])
      .mockResolvedValueOnce([{ ActiveLocksCount: 0 }])
      .mockResolvedValueOnce([
        createTestReadModelLedgerRow({
          Cursor: 'test-cursor-1',
        }),
      ])

    expect(
      await status(pool, 'test-read-model', eventstoreAdapter, true)
    ).toEqual(
      expect.objectContaining({
        isAlive: false,
      })
    )

    expect(
      eventstoreAdapter.getCursorUntilEventTypes
    ).toBeCalledWith('test-cursor-1', ['test-event'])

    expect(
      eventstoreAdapter.getCursorUntilEventTypes
    ).toBeCalledWith('test-cursor-1', ['*'])
  })

  test('waits for alive status for 20 seconds', async () => {
    for (let i = 1; i <= 21; i++) {
      mocked(Date.now).mockReturnValueOnce(i * 1000)
    }

    mocked(eventstoreAdapter.getCursorUntilEventTypes)
      .mockResolvedValueOnce('test-cursor-2')
      .mockResolvedValueOnce('test-cursor-3')

    mocked(pool.inlineLedgerRunQuery)
      .mockResolvedValueOnce([
        createTestReadModelLedgerRow({
          Cursor: 'test-cursor-1',
        }),
      ])
      .mockResolvedValueOnce([{ ActiveLocksCount: 0 }])
      .mockResolvedValueOnce([
        createTestReadModelLedgerRow({
          Cursor: 'test-cursor-1',
        }),
      ])

    expect(
      await status(pool, 'test-read-model', eventstoreAdapter, true)
    ).toEqual(
      expect.objectContaining({
        isAlive: false,
      })
    )

    expect(Date.now).toBeCalledTimes(21)
  })

  test('returns true if cursor in ledger is changed while execution (lock is missed every time) (#2092)', async () => {
    mocked(Date.now)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(1000)
      .mockReturnValueOnce(2000)
      .mockReturnValueOnce(3000)
      .mockReturnValueOnce(30000)

    mocked(eventstoreAdapter.getCursorUntilEventTypes)
      .mockResolvedValueOnce('test-cursor-2')
      .mockResolvedValueOnce('test-cursor-3')
      .mockResolvedValueOnce('test-cursor-3')
      .mockResolvedValueOnce('test-cursor-3')

    mocked(pool.inlineLedgerRunQuery)
      .mockResolvedValueOnce([
        createTestReadModelLedgerRow({
          Cursor: 'test-cursor-1',
        }),
      ])
      .mockResolvedValueOnce([{ ActiveLocksCount: 0 }])
      .mockResolvedValueOnce([
        createTestReadModelLedgerRow({
          Cursor: 'test-cursor-2',
        }),
      ])
      .mockResolvedValueOnce([{ ActiveLocksCount: 0 }])
      .mockResolvedValueOnce([
        createTestReadModelLedgerRow({
          Cursor: 'test-cursor-3',
        }),
      ])

    expect(
      await status(pool, 'test-read-model', eventstoreAdapter, true)
    ).toEqual(
      expect.objectContaining({
        isAlive: true,
      })
    )

    expect(
      eventstoreAdapter.getCursorUntilEventTypes
    ).toBeCalledWith('test-cursor-2', ['test-event'])

    expect(
      eventstoreAdapter.getCursorUntilEventTypes
    ).toBeCalledWith('test-cursor-2', ['*'])

    expect(
      eventstoreAdapter.getCursorUntilEventTypes
    ).toBeCalledWith('test-cursor-3', ['test-event'])

    expect(
      eventstoreAdapter.getCursorUntilEventTypes
    ).toBeCalledWith('test-cursor-3', ['*'])
  })

  test('returns true if eventstore end cursor is changed while execution (new events are added) (#2092)', async () => {
    mocked(Date.now)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(1000)
      .mockReturnValueOnce(2000)
      .mockReturnValueOnce(3000)
      .mockReturnValueOnce(30000)

    mocked(eventstoreAdapter.getCursorUntilEventTypes)
      .mockResolvedValueOnce('test-cursor-1')
      .mockResolvedValueOnce('test-cursor-2')
      .mockResolvedValueOnce('test-cursor-2')
      .mockResolvedValueOnce('test-cursor-3')
      .mockResolvedValueOnce('test-cursor-3')
      .mockResolvedValueOnce('test-cursor-3')

    mocked(pool.inlineLedgerRunQuery)
      .mockResolvedValueOnce([
        createTestReadModelLedgerRow({
          Cursor: 'test-cursor-1',
        }),
      ])
      .mockResolvedValueOnce([{ ActiveLocksCount: 0 }])
      .mockResolvedValueOnce([
        createTestReadModelLedgerRow({
          Cursor: 'test-cursor-1',
        }),
      ])
      .mockResolvedValueOnce([{ ActiveLocksCount: 0 }])
      .mockResolvedValueOnce([
        createTestReadModelLedgerRow({
          Cursor: 'test-cursor-2',
        }),
      ])
      .mockResolvedValueOnce([{ ActiveLocksCount: 0 }])
      .mockResolvedValueOnce([
        createTestReadModelLedgerRow({
          Cursor: 'test-cursor-3',
        }),
      ])

    expect(
      await status(pool, 'test-read-model', eventstoreAdapter, true)
    ).toEqual(
      expect.objectContaining({
        isAlive: true,
      })
    )

    expect(
      eventstoreAdapter.getCursorUntilEventTypes
    ).toBeCalledWith('test-cursor-1', ['test-event'])

    expect(
      eventstoreAdapter.getCursorUntilEventTypes
    ).toBeCalledWith('test-cursor-1', ['*'])

    expect(
      eventstoreAdapter.getCursorUntilEventTypes
    ).toBeCalledWith('test-cursor-2', ['test-event'])

    expect(
      eventstoreAdapter.getCursorUntilEventTypes
    ).toBeCalledWith('test-cursor-2', ['*'])

    expect(
      eventstoreAdapter.getCursorUntilEventTypes
    ).toBeCalledWith('test-cursor-3', ['test-event'])

    expect(
      eventstoreAdapter.getCursorUntilEventTypes
    ).toBeCalledWith('test-cursor-3', ['*'])
  })
})
