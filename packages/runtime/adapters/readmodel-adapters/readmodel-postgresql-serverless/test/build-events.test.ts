import { buildEvents } from '../src/build'

describe('buildEvents', () => {
  const readModelName = 'readModelName'
  const inputCursor = null
  const eventTypes = ['ITEM_CREATED']
  const xaKey = 'xaKey'
  const databaseNameAsId = 'databaseNameAsId'
  const ledgerTableNameAsId = 'ledgerTableNameAsId'
  const trxTableNameAsId = 'trxTableNameAsId'

  const awsSecretStoreArn = 'awsSecretStoreArn'
  const dbClusterOrInstanceArn = 'dbClusterOrInstanceArn'

  test('should call projection with secret manager', async () => {
    const events = [
      {
        type: 'ITEM_CREATED',
        aggregateId: 'aggregateId',
        payload: { value: 'value' },
      },
    ]

    const cursor = Array.from(new Array(256)).fill('A').join('')
    const next = jest.fn()
    const escapeStr = (str: string): string => str
    const store = {
      update: jest.fn(),
    }

    const encrypt = jest.fn()
    const decrypt = jest.fn()
    const getEncryption = () => ({ encrypt, decrypt })
    const PassthroughError = Error

    const projection: Parameters<typeof buildEvents>[4] = {
      acquireInitHandler: (
        ...args: Parameters<
          Parameters<typeof buildEvents>[4]['acquireInitHandler']
        >
      ) => async () => {
        void args
      },

      acquireEventHandler: (
        store: Parameters<
          Parameters<typeof buildEvents>[4]['acquireEventHandler']
        >[0],
        event: Parameters<
          Parameters<typeof buildEvents>[4]['acquireEventHandler']
        >[1]
      ) => {
        const encryption = getEncryption()
        return async () => {
          const aggregateId = event.aggregateId
          const value = (event.payload as { value: string }).value
          //eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const decrypt = encryption!.decrypt
          const item = {
            value: decrypt(value),
          }

          await store.insert('TableName', { aggregateId, ...item })
        }
      },
    }

    const eventstoreAdapter = {
      loadEvents: jest
        .fn()
        .mockReturnValueOnce(Promise.resolve({ events }))
        .mockReturnValue(Promise.resolve({ events: [] })),
      getNextCursor: jest.fn().mockReturnValue(cursor),
    }

    const inlineLedgerExecuteStatement = jest
      .fn()
      .mockReturnValue(Promise.resolve())
    const generateGuid = () => 'guid'
    const getVacantTimeInMillis = () => 0
    const rdsDataService = {
      beginTransaction: jest
        .fn()
        .mockReturnValue(Promise.resolve({ transactionId: 'transactionId' })),
      commitTransaction: jest.fn().mockReturnValue(Promise.resolve()),
    }

    try {
      await buildEvents(
        {
          ledgerTableNameAsId,
          databaseNameAsId,
          trxTableNameAsId,
          eventTypes,
          inputCursor,
          //eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          readModelLedger: null! as any,
          xaKey,
        },
        {
          PassthroughError,
          dbClusterOrInstanceArn,
          awsSecretStoreArn,
          rdsDataService,
          inlineLedgerExecuteStatement,
          generateGuid,
          escapeStr,
        } as any,
        readModelName,
        store as any,
        projection,
        next,
        eventstoreAdapter,
        getVacantTimeInMillis
      )
      throw new Error('Test failed')
    } catch (error) {
      if (!(error instanceof PassthroughError)) {
        throw error
      }
    }

    expect(decrypt).toHaveBeenCalledWith('value')
  })

  test('should invoke event-store with proper events amount', async () => {
    const firstEvent = {
      type: 'ITEM_CREATED',
      aggregateId: 'aggregateId',
      payload: { value: 'value' },
    }
    const secondEvent = {
      type: 'ITEM_REMOVED',
      aggregateId: 'aggregateId',
      payload: null,
    }

    const firstCursor = Array.from(new Array(256)).fill('A').join('')
    const secondCursor = `${firstCursor.substring(0, firstCursor.length - 1)}B`
    const thirdCursor = `${firstCursor.substring(0, firstCursor.length - 1)}C`

    const next = jest.fn()
    const escapeStr = (str: string): string => str
    const store = {}
    const PassthroughError = Error

    const projection: Parameters<typeof buildEvents>[4] = {
      acquireInitHandler: (
        ...args: Parameters<
          Parameters<typeof buildEvents>[4]['acquireInitHandler']
        >
      ) => async () => {
        void args
      },
      acquireEventHandler: (
        ...args: Parameters<
          Parameters<typeof buildEvents>[4]['acquireEventHandler']
        >
      ) => async () => {
        void args
      },
    }

    const eventstoreAdapter = {
      loadEvents: jest
        .fn()
        .mockReturnValueOnce(
          Promise.resolve({ events: [firstEvent], cursor: firstCursor })
        )
        .mockReturnValueOnce(
          Promise.resolve({ events: [secondEvent], cursor: secondCursor })
        )
        .mockReturnValue(Promise.resolve({ events: [], cursor: thirdCursor })),
      getNextCursor: jest
        .fn()
        .mockReturnValueOnce(firstCursor)
        .mockReturnValueOnce(secondCursor)
        .mockReturnValue(thirdCursor),
    }

    const inlineLedgerExecuteStatement = jest
      .fn()
      .mockReturnValue(Promise.resolve())
    const generateGuid = () => 'guid'
    const getVacantTimeInMillis = () => 0
    const rdsDataService = {
      beginTransaction: jest
        .fn()
        .mockReturnValue(Promise.resolve({ transactionId: 'transactionId' })),
      commitTransaction: jest.fn().mockReturnValue(Promise.resolve()),
    }

    try {
      await buildEvents(
        {
          ledgerTableNameAsId,
          databaseNameAsId,
          trxTableNameAsId,
          eventTypes,
          inputCursor,
          //eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          readModelLedger: null! as any,
          xaKey,
        },
        {
          PassthroughError,
          dbClusterOrInstanceArn,
          awsSecretStoreArn,
          rdsDataService,
          inlineLedgerExecuteStatement,
          generateGuid,
          escapeStr,
        } as any,
        readModelName,
        store as any,
        projection,
        next,
        eventstoreAdapter,
        getVacantTimeInMillis
      )
      throw new Error('Test failed')
    } catch (error) {
      if (!(error instanceof PassthroughError)) {
        throw error
      }
    }

    expect(eventstoreAdapter.getNextCursor.mock.calls.length).toEqual(2)

    expect(eventstoreAdapter.getNextCursor.mock.calls[0][0]).toEqual(null)
    expect(eventstoreAdapter.getNextCursor.mock.calls[0][1]).toEqual([
      firstEvent,
    ])

    expect(eventstoreAdapter.getNextCursor.mock.calls[1][0]).toEqual(
      firstCursor
    )
    expect(eventstoreAdapter.getNextCursor.mock.calls[1][1]).toEqual([
      secondEvent,
    ])

    expect(eventstoreAdapter.loadEvents.mock.calls.length).toEqual(3)

    expect(eventstoreAdapter.loadEvents.mock.calls[0][0].cursor).toEqual(null)
    expect(
      eventstoreAdapter.loadEvents.mock.calls[0][0].eventsSizeLimit
    ).toEqual(512000)
    expect(eventstoreAdapter.loadEvents.mock.calls[0][0].limit).toEqual(100)

    expect(eventstoreAdapter.loadEvents.mock.calls[1][0].cursor).toEqual(
      firstCursor
    )
    expect(
      eventstoreAdapter.loadEvents.mock.calls[1][0].eventsSizeLimit
    ).toEqual(512000)
    expect(eventstoreAdapter.loadEvents.mock.calls[1][0].limit).toEqual(1000)

    expect(eventstoreAdapter.loadEvents.mock.calls[2][0].cursor).toEqual(
      secondCursor
    )
    expect(
      eventstoreAdapter.loadEvents.mock.calls[2][0].eventsSizeLimit
    ).toEqual(512000)
    expect(eventstoreAdapter.loadEvents.mock.calls[2][0].limit).toEqual(1000)
  })
})
