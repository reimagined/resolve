import type {
  InlineLedgerExecuteTransactionMethod,
  InlineLedgerExecuteTransactionMethodNames,
  InlineLedgerExecuteTransactionMethodParameters,
  InlineLedgerExecuteTransactionMethodReturnType,
} from './types'

const inlineLedgerExecuteTransaction: InlineLedgerExecuteTransactionMethod = async <
  MethodName extends InlineLedgerExecuteTransactionMethodNames
>(
  ...args: InlineLedgerExecuteTransactionMethodParameters<MethodName>
): Promise<InlineLedgerExecuteTransactionMethodReturnType<MethodName>> => {
  const [pool, method, inputTransactionId] = args
  const {
    PassthroughError,
    rdsDataService,
    dbClusterOrInstanceArn,
    awsSecretStoreArn,
  } = pool

  switch (method) {
    case 'begin': {
      for (;;) {
        try {
          const { transactionId } = await rdsDataService
            .beginTransaction({
              resourceArn: dbClusterOrInstanceArn,
              secretArn: awsSecretStoreArn,
              database: 'postgres',
            })
            .promise()
          return transactionId as InlineLedgerExecuteTransactionMethodReturnType<
            MethodName
          >
        } catch (error) {
          PassthroughError.maybeThrowPassthroughError(error, null)
        }
      }
    }

    case 'commit': {
      for (;;) {
        try {
          await rdsDataService
            .commitTransaction({
              resourceArn: dbClusterOrInstanceArn,
              secretArn: awsSecretStoreArn,
              transactionId: inputTransactionId,
            })
            .promise()
          return null as InlineLedgerExecuteTransactionMethodReturnType<
            MethodName
          >
        } catch (error) {
          PassthroughError.maybeThrowPassthroughError(error, null)
        }
      }
    }

    case 'rollback': {
      for (;;) {
        try {
          await rdsDataService
            .rollbackTransaction({
              resourceArn: dbClusterOrInstanceArn,
              secretArn: awsSecretStoreArn,
              transactionId: inputTransactionId,
            })
            .promise()
          return null as InlineLedgerExecuteTransactionMethodReturnType<
            MethodName
          >
        } catch (error) {
          PassthroughError.maybeThrowPassthroughError(error, null)
        }
      }
    }

    default: {
      throw new Error(`Invalid inline ledger transaction operation "${method}"`)
    }
  }
}

export default inlineLedgerExecuteTransaction
