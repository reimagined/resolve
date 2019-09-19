const paginateEvents = async ({ collection }, offset, batchSize) => {
  const rows = await collection
    .find()
    .sort({
      timestamp: 1,
      aggregateVersion: 1
    })
    .skip(offset)
    .limit(batchSize)
    .toArray()

  for (let index = 0; index < rows.length; index++) {
    const event = rows[index]
    event.eventId = offset + index
  }

  return rows
}

export default paginateEvents
