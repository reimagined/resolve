const unfreeze = async ({
  executeStatement,
  databaseName,
  eventsTableName,
  escapeId,
}) => {
  const databaseNameAsId = escapeId(databaseName);
  const freezeTableNameAsId = escapeId(`${eventsTableName}-freeze`);

  await executeStatement(
    `DROP TABLE IF EXISTS ${databaseNameAsId}.${freezeTableNameAsId}`
  );
};

export default unfreeze;
