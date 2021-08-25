import { buildEvents } from '../src/build'

// Although documentation describes a 1 MB limit, the actual limit is 512 KB
// https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/data-api.html
const MAX_RDS_DATA_API_RESPONSE_SIZE = 512000

const eventStoreOperationTimeLimited = jest
  .fn()
  .mockImplementation(
    (adapter, createError, getVacantTime, methodName, ...args) =>
      adapter[methodName](...args)
  )

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
      getSecretsManager: jest.fn().mockReturnValue({
        getSecret: async (id: string): Promise<string | null> => {
          return ''
        },
        setSecret: async (id: string, secret: string): Promise<void> => {
          return
        },
        deleteSecret: async (id: string): Promise<boolean> => {
          return true
        },
      }),
      gatherSecretsFromEvents: jest.fn().mockReturnValue({
        existingSecrets: [],
        deletedSecrets: [],
      }),
    } as any

    const buildInfo = {
      initiator: 'read-model-next',
      notificationId: '0',
      sendTime: 0,
    } as const

    const inlineLedgerExecuteStatement = jest
      .fn()
      .mockReturnValue(Promise.resolve())
    const inlineLedgerExecuteTransaction = jest
      .fn()
      .mockReturnValue(Promise.resolve('transaction-id'))
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
          metricData: {},
        },
        {
          PassthroughError,
          eventStoreOperationTimeLimited,
          dbClusterOrInstanceArn,
          awsSecretStoreArn,
          rdsDataService,
          inlineLedgerExecuteStatement,
          inlineLedgerExecuteTransaction,
          generateGuid,
          escapeStr,
        } as any,
        readModelName,
        store as any,
        projection,
        next,
        eventstoreAdapter,
        getVacantTimeInMillis,
        buildInfo
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

    const buildInfo = {
      initiator: 'read-model-next',
      notificationId: '0',
      sendTime: 0,
    } as const

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
      getSecretsManager: jest.fn().mockReturnValue({
        getSecret: async (id: string): Promise<string | null> => {
          return ''
        },
        setSecret: async (id: string, secret: string): Promise<void> => {
          return
        },
        deleteSecret: async (id: string): Promise<boolean> => {
          return true
        },
      }),
      gatherSecretsFromEvents: jest.fn().mockReturnValue({
        existingSecrets: [],
        deletedSecrets: [],
      }),
    } as any

    const inlineLedgerExecuteStatement = jest
      .fn()
      .mockReturnValue(Promise.resolve())
    const inlineLedgerExecuteTransaction = jest
      .fn()
      .mockReturnValue(Promise.resolve('transaction-id'))
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
          metricData: {},
        },
        {
          PassthroughError,
          eventStoreOperationTimeLimited,
          dbClusterOrInstanceArn,
          awsSecretStoreArn,
          rdsDataService,
          inlineLedgerExecuteStatement,
          inlineLedgerExecuteTransaction,
          generateGuid,
          escapeStr,
        } as any,
        readModelName,
        store as any,
        projection,
        next,
        eventstoreAdapter,
        getVacantTimeInMillis,
        buildInfo
      )
      throw new Error('Test failed')
    } catch (error) {
      if (!(error instanceof PassthroughError)) {
        throw error
      }
    }

    expect(eventstoreAdapter.getNextCursor).toBeCalledTimes(2)
    expect(eventstoreAdapter.getNextCursor).toBeCalledWith(null, [firstEvent])
    expect(eventstoreAdapter.getNextCursor).toBeCalledWith(firstCursor, [
      secondEvent,
    ])

    expect(eventstoreAdapter.loadEvents).toBeCalledTimes(3)
    expect(eventstoreAdapter.loadEvents).toBeCalledWith({
      eventsSizeLimit: MAX_RDS_DATA_API_RESPONSE_SIZE,
      cursor: null,
      limit: 100,
      eventTypes,
    })
    expect(eventstoreAdapter.loadEvents).toBeCalledWith({
      eventsSizeLimit: MAX_RDS_DATA_API_RESPONSE_SIZE,
      cursor: firstCursor,
      limit: 1000,
      eventTypes,
    })
    expect(eventstoreAdapter.loadEvents).toBeCalledWith({
      eventsSizeLimit: MAX_RDS_DATA_API_RESPONSE_SIZE,
      cursor: secondCursor,
      limit: 1000,
      eventTypes,
    })
  })
})
