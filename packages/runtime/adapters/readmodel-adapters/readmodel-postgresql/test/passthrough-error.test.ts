import PassthroughError from '../src/passthrough-error'
import type { PassthroughErrorLike } from '../src/types'
describe('PassthroughError', () => {
  const PostgresErrors = Object.freeze({
    // https://www.postgresql.org/docs/10/errcodes-appendix.html
    CONNECTION_EXCEPTION: '08000',
    CONNECTION_DOES_NOT_EXIST: '08003',
    CONNECTION_FAILURE: '08006',
    SQLCLIENT_UNABLE_TO_ESTABLISH_SQLCONNECTION: '08001',
    SQLSERVER_REJECTED_ESTABLISHMENT_OF_SQLCONNECTION: '08004',
    DIVISION_BY_ZERO: '22012',
    CARDINALITY_VIOLATION: '21000',
    SERIALIZATION_FAILURE: '40001',
    IN_FAILED_SQL_TRANSACTION: '25P02',
    NO_ACTIVE_SQL_TRANSACTION: '25P01',
    TRANSACTION_ROLLBACK: '40000',
    LOCK_NOT_AVAILABLE: '55P03',
    DEADLOCK_DETECTED: '40P01',
  } as const)

  test('failed test with custom error', async () => {
    const error = new Error('Custom error') as PassthroughErrorLike
    expect.assertions(1)
    try {
      PassthroughError.maybeThrowPassthroughError(error, false)
    } catch (error) {
      expect(error).not.toBeInstanceOf(PassthroughError)
    }
  })

  test('terminating connection due to serverless scale event timeout', async () => {
    const error = new Error(
      'terminating connection due to serverless scale event timeout'
    ) as PassthroughErrorLike
    expect.assertions(1)
    try {
      PassthroughError.maybeThrowPassthroughError(error, false)
    } catch (error) {
      expect(error).toBeInstanceOf(PassthroughError)
    }
  })

  test('terminating connection due to administrator command', async () => {
    const error = new Error(
      'terminating connection due to administrator command'
    ) as PassthroughErrorLike
    expect.assertions(1)
    try {
      PassthroughError.maybeThrowPassthroughError(error, false)
    } catch (error) {
      expect(error).toBeInstanceOf(PassthroughError)
    }
  })

  test('connection terminated', async () => {
    const error = new Error('Connection terminated') as PassthroughErrorLike
    expect.assertions(1)
    try {
      PassthroughError.maybeThrowPassthroughError(error, false)
    } catch (error) {
      expect(error).toBeInstanceOf(PassthroughError)
    }
  })

  test('query read timeout', async () => {
    const error = new Error('Query read timeout') as PassthroughErrorLike
    expect.assertions(1)
    try {
      PassthroughError.maybeThrowPassthroughError(error, false)
    } catch (error) {
      expect(error).toBeInstanceOf(PassthroughError)
    }
  })

  test('remaining connection slots are reserved', async () => {
    const error = new Error(
      'Remaining connection slots are reserved'
    ) as PassthroughErrorLike
    expect.assertions(1)
    try {
      PassthroughError.maybeThrowPassthroughError(error, false)
    } catch (error) {
      expect(error).toBeInstanceOf(PassthroughError)
    }
  })

  test('too many clients already', async () => {
    const error = new Error('Too many clients already') as PassthroughErrorLike
    expect.assertions(1)
    try {
      PassthroughError.maybeThrowPassthroughError(error, false)
    } catch (error) {
      expect(error).toBeInstanceOf(PassthroughError)
    }
  })

  test('connection terminated unexpectedly', async () => {
    const error = new Error(
      'Connection terminated unexpectedly'
    ) as PassthroughErrorLike
    expect.assertions(1)
    try {
      PassthroughError.maybeThrowPassthroughError(error, false)
    } catch (error) {
      expect(error).toBeInstanceOf(PassthroughError)
    }
  })

  test('canceling statement due to statement timeout', async () => {
    const error = new Error(
      'canceling statement due to statement timeout'
    ) as PassthroughErrorLike
    expect.assertions(1)
    try {
      PassthroughError.maybeThrowPassthroughError(error, false)
    } catch (error) {
      expect(error).toBeInstanceOf(PassthroughError)
    }
  })

  test('ECONNRESET status', async () => {
    // eslint-disable-next-line spellcheck/spell-checker
    const error = new Error('Postgress error') as PassthroughErrorLike
    error.name = 'ECONNRESET'
    expect.assertions(1)
    try {
      PassthroughError.maybeThrowPassthroughError(error, true)
    } catch (error) {
      expect(error).toBeInstanceOf(PassthroughError)
    }
  })

  test('connection exception', async () => {
    // eslint-disable-next-line spellcheck/spell-checker
    const error = new Error('Postgress error') as PassthroughErrorLike
    error.name = PostgresErrors.CONNECTION_EXCEPTION
    expect.assertions(1)
    try {
      PassthroughError.maybeThrowPassthroughError(error, true)
    } catch (error) {
      expect(error).toBeInstanceOf(PassthroughError)
    }
  })

  test('connection does not exist', async () => {
    // eslint-disable-next-line spellcheck/spell-checker
    const error = new Error('Postgress error') as PassthroughErrorLike
    error.name = PostgresErrors.CONNECTION_DOES_NOT_EXIST
    expect.assertions(1)
    try {
      PassthroughError.maybeThrowPassthroughError(error, true)
    } catch (error) {
      expect(error).toBeInstanceOf(PassthroughError)
    }
  })

  test('connection failure', async () => {
    // eslint-disable-next-line spellcheck/spell-checker
    const error = new Error('Postgress error') as PassthroughErrorLike
    error.name = PostgresErrors.CONNECTION_FAILURE
    expect.assertions(1)
    try {
      PassthroughError.maybeThrowPassthroughError(error, true)
    } catch (error) {
      expect(error).toBeInstanceOf(PassthroughError)
    }
  })

  test('SQL client unable to establish SQL connection', async () => {
    // eslint-disable-next-line spellcheck/spell-checker
    const error = new Error('Postgress error') as PassthroughErrorLike
    error.name = PostgresErrors.SQLCLIENT_UNABLE_TO_ESTABLISH_SQLCONNECTION
    expect.assertions(1)
    try {
      PassthroughError.maybeThrowPassthroughError(error, true)
    } catch (error) {
      expect(error).toBeInstanceOf(PassthroughError)
    }
  })

  test('SQL server rejected establishment of SQL connection', async () => {
    // eslint-disable-next-line spellcheck/spell-checker
    const error = new Error('Postgress error') as PassthroughErrorLike
    error.name =
      PostgresErrors.SQLSERVER_REJECTED_ESTABLISHMENT_OF_SQLCONNECTION
    expect.assertions(1)
    try {
      PassthroughError.maybeThrowPassthroughError(error, true)
    } catch (error) {
      expect(error).toBeInstanceOf(PassthroughError)
    }
  })

  test('division by zero', async () => {
    // eslint-disable-next-line spellcheck/spell-checker
    const error = new Error('Postgress error') as PassthroughErrorLike
    error.name = PostgresErrors.DIVISION_BY_ZERO
    expect.assertions(1)
    try {
      PassthroughError.maybeThrowPassthroughError(error, true)
    } catch (error) {
      expect(error).toBeInstanceOf(PassthroughError)
    }
  })
  // eslint-disable-next-line spellcheck/spell-checker
  test('cardinality violation', async () => {
    // eslint-disable-next-line spellcheck/spell-checker
    const error = new Error('Postgress error') as PassthroughErrorLike
    error.name = PostgresErrors.CARDINALITY_VIOLATION
    expect.assertions(1)
    try {
      PassthroughError.maybeThrowPassthroughError(error, true)
    } catch (error) {
      expect(error).toBeInstanceOf(PassthroughError)
    }
  })

  test('serialization failure', async () => {
    // eslint-disable-next-line spellcheck/spell-checker
    const error = new Error('Postgress error') as PassthroughErrorLike
    error.name = PostgresErrors.SERIALIZATION_FAILURE
    expect.assertions(1)
    try {
      PassthroughError.maybeThrowPassthroughError(error, true)
    } catch (error) {
      expect(error).toBeInstanceOf(PassthroughError)
    }
  })

  test('in failed SQL transaction', async () => {
    // eslint-disable-next-line spellcheck/spell-checker
    const error = new Error('Postgress error') as PassthroughErrorLike
    error.name = PostgresErrors.IN_FAILED_SQL_TRANSACTION
    expect.assertions(1)
    try {
      PassthroughError.maybeThrowPassthroughError(error, true)
    } catch (error) {
      expect(error).toBeInstanceOf(PassthroughError)
    }
  })

  test('no active SQL transaction', async () => {
    // eslint-disable-next-line spellcheck/spell-checker
    const error = new Error('Postgress error') as PassthroughErrorLike
    error.name = PostgresErrors.NO_ACTIVE_SQL_TRANSACTION
    expect.assertions(1)
    try {
      PassthroughError.maybeThrowPassthroughError(error, true)
    } catch (error) {
      expect(error).toBeInstanceOf(PassthroughError)
    }
  })

  test('transaction rollback', async () => {
    // eslint-disable-next-line spellcheck/spell-checker
    const error = new Error('Postgress error') as PassthroughErrorLike
    error.name = PostgresErrors.TRANSACTION_ROLLBACK
    expect.assertions(1)
    try {
      PassthroughError.maybeThrowPassthroughError(error, true)
    } catch (error) {
      expect(error).toBeInstanceOf(PassthroughError)
    }
  })
  // eslint-disable-next-line spellcheck/spell-checker
  test('lock not aviable', async () => {
    // eslint-disable-next-line spellcheck/spell-checker
    const error = new Error('Postgress error') as PassthroughErrorLike
    error.name = PostgresErrors.LOCK_NOT_AVAILABLE
    expect.assertions(1)
    try {
      PassthroughError.maybeThrowPassthroughError(error, true)
    } catch (error) {
      expect(error).toBeInstanceOf(PassthroughError)
    }
  })

  test('deadlock detected', async () => {
    // eslint-disable-next-line spellcheck/spell-checker
    const error = new Error('Postgress error') as PassthroughErrorLike
    error.name = PostgresErrors.DEADLOCK_DETECTED
    expect.assertions(1)
    try {
      PassthroughError.maybeThrowPassthroughError(error, true)
    } catch (error) {
      expect(error).toBeInstanceOf(PassthroughError)
    }
  })
})
