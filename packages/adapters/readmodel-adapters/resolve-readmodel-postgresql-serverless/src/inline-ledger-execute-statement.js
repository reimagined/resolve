const inlineLedgerExecuteStatement = async (pool, sql, transactionId) => {
  const {
    PassthroughError,
    rdsDataService,
    dbClusterOrInstanceArn,
    awsSecretStoreArn,
    coercer,
  } = pool;
  try {
    const result = await rdsDataService.executeStatement({
      resourceArn: dbClusterOrInstanceArn,
      secretArn: awsSecretStoreArn,
      database: 'postgres',
      continueAfterTimeout: false,
      includeResultMetadata: true,
      ...(transactionId != null ? { transactionId } : {}),
      sql,
    });

    const { columnMetadata, records } = result;

    if (!Array.isArray(records) || columnMetadata == null) {
      return null;
    }

    const rows = [];
    for (const record of records) {
      const row = {};
      for (let i = 0; i < columnMetadata.length; i++) {
        row[columnMetadata[i].name] = coercer(record[i]);
      }
      rows.push(row);
    }

    return rows;
  } catch (error) {
    if (PassthroughError.isPassthroughError(error)) {
      throw new PassthroughError(transactionId);
    }

    throw error;
  }
};

export default inlineLedgerExecuteStatement;
