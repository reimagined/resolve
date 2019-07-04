const getTemplateDocument = async (pool, readModelName, tableName) => {
  if (!pool.templateDocuments.has(readModelName)) {
    pool.templateDocuments.set(readModelName, new Map())
  }

  if (!pool.templateDocuments.get(readModelName).has(tableName)) {
    const collection = await pool.getCollection(readModelName, tableName)
    const root = await collection.findOne(
      { _id: pool.rootId },
      {
        projection: { indexNames: 1, fieldNames: 1 }
      }
    )
    const { indexNames, fieldNames } = root
    const templateDocument = {}
    for (const indexName of indexNames) {
      templateDocument[indexName] = pool.ObjectID()
    }
    for (const fieldName of fieldNames) {
      templateDocument[fieldName] = null
    }

    Object.freeze(templateDocument)

    pool.templateDocuments.get(readModelName).set(tableName, templateDocument)
  }

  return pool.templateDocuments.get(readModelName).get(tableName)
}

export default getTemplateDocument
