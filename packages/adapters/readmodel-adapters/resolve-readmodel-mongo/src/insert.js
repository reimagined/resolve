const insert = async (pool, readModelName, tableName, document) => {
  const { getCollection, getTemplateDocument, rootId } = pool
  const collection = await getCollection(readModelName, tableName)
  const templateDocument = await getTemplateDocument(
    pool,
    readModelName,
    tableName
  )

  const documentId = pool.ObjectID()

  const insertingDocument = Object.assign(
    { _id: documentId },
    templateDocument,
    document
  )

  const readModelTables = await pool.listReadModelTables(pool, readModelName)
  const transactionCollection = await pool.getCollection(
    readModelName,
    readModelTables[0]
  )

  await transactionCollection.updateOne(
    { _id: rootId },
    {
      $push: {
        transactionList: {
          collectionName: tableName,
          currentId: documentId,
          snapshotId: null
        }
      }
    }
  )

  await collection.insertOne(insertingDocument)
}

export default insert
