import { buildEvents } from '../src/build'

describe('buildEvents', () => {
  test('should call projection with secret manager', async () => {
    const readModelName = 'readModelName'
    const inputCursor = null
    const eventTypes = ['ITEM_CREATED']
    const xaKey = 'xaKey'
    const databaseNameAsId = 'databaseNameAsId'
    const ledgerTableNameAsId = 'ledgerTableNameAsId'
    const trxTableNameAsId = 'trxTableNameAsId'

    const awsSecretStoreArn = 'awsSecretStoreArn'
    const dbClusterOrInstanceArn = 'dbClusterOrInstanceArn'

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
    const provideLedger = jest.fn()

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
        getVacantTimeInMillis,
        provideLedger
      )
      throw new Error('Test failed')
    } catch (error) {
      if (!(error instanceof PassthroughError)) {
        throw error
      }
    }

    expect(decrypt).toHaveBeenCalledWith('value')
  })
})
