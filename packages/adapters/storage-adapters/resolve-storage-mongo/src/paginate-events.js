const paginateEvents = async (
  { database, collectionName, shapeEvent },
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

  const resultRows = []
  for (let index = 0; index < rows.length; index++) {
    const event = rows[index]
    resultRows.push(
      shapeEvent(event, { [Symbol.for('sequenceIndex')]: offset + index })
    )
  }

  return resultRows
}

export default paginateEvents
