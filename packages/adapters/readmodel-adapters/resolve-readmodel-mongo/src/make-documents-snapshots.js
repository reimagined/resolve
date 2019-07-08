const makeDocumentsSnapshots = async (
  pool,
  readModelName,
  tableName,
  searchExpression
) => {
  const { getCollection, rootId, rootIndex, contentField } = pool
  const collection = await getCollection(readModelName, tableName)

  const documents = await collection.find(searchExpression).toArray()
  const documentsSnapshots = []
  const documentMappings = []

  for (const document of documents) {
    const snapshotId = pool.ObjectID()
    const templateDocument = await pool.getTemplateDocument(
      pool,
      readModelName,
      tableName
    )

    const indexNames = Object.keys(templateDocument).filter(
      key => templateDocument[key] != null
    )
    const fieldNames = Object.keys(templateDocument).filter(
      key => templateDocument[key] == null
    )

    const documentSnapshot = {
      _id: snapshotId,
      [rootIndex]: true,
      [contentField]: {}
    }

    for (const indexName of indexNames) {
      documentSnapshot[contentField][indexName] = document[indexName]
      documentSnapshot[indexName] = pool.ObjectID()
    }

    for (const fieldName of fieldNames) {
      documentSnapshot[contentField][fieldName] = document[fieldName]
    }

    documentsSnapshots.push(documentSnapshot)

    documentMappings.push({
      collectionName: tableName,
      currentId: document._id,
      snapshotId
    })
  }

  if (documentsSnapshots.length > 0) {
    await collection.insertMany(documentsSnapshots)
  }

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
          $each: documentMappings
        }
      }
    }
  )
}

export default makeDocumentsSnapshots
