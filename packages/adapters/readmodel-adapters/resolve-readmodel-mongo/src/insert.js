const insert = async (
  { getCollection },
  readModelName,
  tableName,
  document
) => {
  const collection = await getCollection(readModelName, tableName)

  return await collection.insertOne(document)
}

export default insert
