const paginateEvents = async (
  { database, collectionName },
  offset,
  batchSize
) => {
  const collection = await database.collection(collectionName)

  const rows = await collection
    .find()
    .sort({ timestamp: 1 })
    .skip(offset)
    .limit(batchSize)
    .toArray()

  for (let index = 0; index < rows.length; index++) {
    const event = rows[index]
    event[Symbol.for('sequenceIndex')] = offset + index

    delete event.threadId
    delete event.threadCounter
  }

  return rows
}

export default paginateEvents
