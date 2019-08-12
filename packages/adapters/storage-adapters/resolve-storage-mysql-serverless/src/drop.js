const drop = async ({
  resourceOptions: { databaseName, userLogin },
  executeStatement,
  escapeId,
  escape
}) => {
  await executeStatement(`DROP DATABASE ${escapeId(databaseName)}`)

  await executeStatement(`DROP USER ${escape(userLogin)}`)
}

export default drop
