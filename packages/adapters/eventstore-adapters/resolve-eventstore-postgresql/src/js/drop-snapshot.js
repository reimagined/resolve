const dropSnapshot = async (
  { databaseName, snapshotsTableName, executeStatement, escapeId, escape },
  snapshotKey
) => {
  const databaseNameAsId = escapeId(databaseName);
  const snapshotsTableNameAsId = escapeId(snapshotsTableName);

  await executeStatement(
    `DELETE FROM ${databaseNameAsId}.${snapshotsTableNameAsId}
    WHERE "snapshotKey" LIKE ${escape(`${snapshotKey}%`)}`
  );
};

export default dropSnapshot;
