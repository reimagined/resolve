const getTemplateDocument = async (pool, readModelName, tableName) => {
  if (!pool.templateDocuments.has(readModelName)) {
    pool.templateDocuments.set(readModelName, new Map())
  }

  if (!pool.templateDocuments.get(readModelName).has(tableName)) {
    const collection = await pool.getCollection(readModelName, tableName)
    const root = await collection.findOne({ _id: pool.rootId })
    const templateDocument = {}
    for (const key of Object.keys(root)) {
      if (root[key] === 1 || root[key] === 0) {
        templateDocument[key] = null
      }
    }
    Object.freeze(templateDocument)

    pool.templateDocuments.get(readModelName).set(tableName, templateDocument)
  }

  return pool.templateDocuments.get(readModelName).get(tableName)
}

export default getTemplateDocument
