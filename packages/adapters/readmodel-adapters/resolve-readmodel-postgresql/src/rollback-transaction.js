import debugLevels from 'resolve-debug-levels';

const log = debugLevels(
  'resolve:resolve-readmodel-postgresql:rollback-transaction'
);

const rollbackTransaction = async (pool) => {
  try {
    log.verbose('Rollback transaction to postgresql database started');
    await pool.runQuery('ROLLBACK');

    log.verbose('Rollback transaction to postgresql database succeed');
  } catch (error) {
    log.verbose('Rollback transaction to postgresql database failed', error);

    throw error;
  }
};

export default rollbackTransaction;
