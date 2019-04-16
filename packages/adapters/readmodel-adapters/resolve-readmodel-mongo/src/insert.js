const insert = async (pool, readModelName, tableName, document) => {
  const { getCollection, getTemplateDocument } = pool
  const collection = await getCollection(readModelName, tableName)
  const templateDocument = await getTemplateDocument(
    pool,
    readModelName,
    tableName
  )
  const insertingDocument = Object.assign({}, templateDocument, document)

  return await collection.insertOne(insertingDocument)
}

export default insert
