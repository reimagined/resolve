const drop = async ({
  resourceOptions: { databaseName, userLogin },
  executeSql,
  escapeId,
  escape
}) => {
  await executeSql(`DROP DATABASE ${escapeId(databaseName)}`)

  await executeSql(`DROP USER ${escape(userLogin)}`)
}

export default drop
