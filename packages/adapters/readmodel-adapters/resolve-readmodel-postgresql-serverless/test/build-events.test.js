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

    const escape = (str) => str

    const store = {
      set: jest.fn(),
    }

    const projection = {
      ITEM_CREATED: async (
        store,
        { aggregateId, payload: { value } },
        { decrypt }
      ) => {
        const item = {
          value: decrypt(value),
        }

        await store.set(aggregateId, item)
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

    const encrypt = jest.fn()
    const decrypt = jest.fn()
    const getEncryption = () => () => ({ encrypt, decrypt })
    const PassthroughError = Error

    try {
      await buildEvents(
        {
          PassthroughError,
          getVacantTimeInMillis,
          getEncryption,
          dbClusterOrInstanceArn,
          awsSecretStoreArn,
          rdsDataService,
          inlineLedgerExecuteStatement,
          generateGuid,
          eventstoreAdapter,
          escape,
          databaseNameAsId,
          ledgerTableNameAsId,
          trxTableNameAsId,
          xaKey,
          eventTypes,
          cursor: inputCursor,
        },
        readModelName,
        store,
        projection,
        next
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
