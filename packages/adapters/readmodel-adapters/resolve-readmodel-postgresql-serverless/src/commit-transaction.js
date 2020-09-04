import debugLevels from 'resolve-debug-levels';

const log = debugLevels(
  'resolve:resolve-readmodel-postgresql-serverless:commit-transaction'
);

const commitTransaction = async (pool) => {
  try {
    log.verbose('Commit transaction to postgresql database started');

    await pool.rdsDataService.executeStatement({
      resourceArn: pool.dbClusterOrInstanceArn,
      secretArn: pool.awsSecretStoreArn,
      transactionId: pool.transactionId,
      sql: `SELECT 0`,
    });

    await pool.rdsDataService.commitTransaction({
      resourceArn: pool.dbClusterOrInstanceArn,
      secretArn: pool.awsSecretStoreArn,
      transactionId: pool.transactionId,
    });

    log.verbose('Commit transaction to postgresql database succeed');
  } catch (error) {
    log.verbose('Commit transaction to postgresql database failed', error);

    throw error;
  } finally {
    pool.transactionId = null;
  }
};

export default commitTransaction;
