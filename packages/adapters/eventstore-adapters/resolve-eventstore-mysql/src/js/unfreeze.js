const unfreeze = async ({
  events: { connection, eventsTableName },
  escapeId,
}) => {
  await connection.execute(
    `DROP TABLE IF EXISTS ${escapeId(`${eventsTableName}-freeze`)}`
  )
}

export default unfreeze
