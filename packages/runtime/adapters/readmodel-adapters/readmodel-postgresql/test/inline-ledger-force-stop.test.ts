import inlineLedgerForceStop from '../src/inline-ledger-force-stop'
import escapeId from '../src/escape-id'
import escapeStr from '../src/escape-str'
import PassthroughError from '../src/passthrough-error'

describe('method "inlineLedgerForceStop"', () => {
  test('should ignore error "pg_signal_backend"', async () => {
    const error = new Error(
      `Can't resume subscription due to error "error: must be a member of the role whose process is being terminated or member of pg_signal_backend`
    )

    const pool: any = {
      PassthroughError,
      inlineLedgerRunQuery: jest.fn().mockRejectedValue(error),
      schemaName: 'schemaName',
      tablePrefix: 'schemaName',
      escapeId,
      escapeStr,
    }
    const readModelName = 'readModelName'

    await expect(
      inlineLedgerForceStop(pool, readModelName)
    ).resolves.toBeUndefined()
  })

  test('should retry PassthroughError', async () => {
    const error = new PassthroughError(true)

    const pool: any = {
      PassthroughError,
      inlineLedgerRunQuery: jest
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValue(undefined),
      schemaName: 'schemaName',
      tablePrefix: 'schemaName',
      escapeId,
      escapeStr,
    }
    const readModelName = 'readModelName'

    await expect(
      inlineLedgerForceStop(pool, readModelName)
    ).resolves.toBeUndefined()

    expect(pool.inlineLedgerRunQuery).toBeCalledTimes(2)
  })

  test('should throw unknown error', async () => {
    const error = new Error()

    const pool: any = {
      PassthroughError,
      inlineLedgerRunQuery: jest.fn().mockRejectedValue(error),
      schemaName: 'schemaName',
      tablePrefix: 'schemaName',
      escapeId,
      escapeStr,
    }
    const readModelName = 'readModelName'

    await expect(inlineLedgerForceStop(pool, readModelName)).rejects.toBe(error)
  })
})
