import 'regenerator-runtime/runtime'

const castType = type => {
  switch (type) {
    case 'number':
      return 'BIGINT NOT NULL'
    case 'string':
      return 'MEDIUMTEXT NOT NULL'
    case 'datetime':
      return 'DATETIME NOT NULL'
    case 'json':
      return 'JSON NULL'
    default:
      return 'MEDIUMBLOB NULL'
  }
}

const createStorage = async ({ connection }, storageName, storageSchema) => {
  await connection.execute(
    `CREATE TABLE ${storageName} (\n` +
      [
        Object.keys(storageSchema.fieldTypes)
          .map(fieldName => `${fieldName} ${castType(storageSchema.fieldTypes[fieldName])}`)
          .join(',\n'),

        `PRIMARY INDEX (${storageSchema.primaryIndex.name})`,

        storageSchema.secondaryIndexes.map(({ name }) => `INDEX USING BTREE (${name})`).join(',\n')
      ].join(',\n') +
      `\n)`
  )
}

const dropStorage = async ({ connection }, storageName) => {
  await connection.execute(`DROP TABLE ${storageName}`)
}

const searchToWhereExpression = expr => {}

const updateToSetExpression = expr => {}

const find = async (
  { connection },
  storageName,
  searchExpression,
  fieldList,
  sort,
  skip,
  limit
) => {
  const fields = fieldList
    .map(fieldName => {
      const [baseName, ...nestedPath] = fieldName.split('.')
      if (nestedPath.length === 0) return baseName
      return `${baseName}->"$.${nestedPath.join('.')}" AS "${fieldName}"`
    })
    .join(', ')

  const skipLimit = `LIMIT ${skip},${isFinite(limit) ? limit : Number.MAX_SAFE_INTEGER}`

  const { searchExpr, searchValues } = searchToWhereExpression(searchExpression)

  const [rows] = await connection.execute(
    `SELECT ${fields} FROM ${storageName}
    WHERE ${searchExpr}
    ORDER BY ${sort.join(', ')}
    ${skipLimit}
  `,
    searchValues
  )

  return rows
}

const insert = async ({ connection }, storageName, document) => {
  await connection.execute(
    `INSERT INTO ${storageName}(${Object.keys(document).join(', ')}
     VALUES(${Object.keys(document)
       .map(_ => '?')
       .join(', ')}))
    `,
    Object.values(document)
  )
}

const update = async ({ connection }, storageName, searchExpression, updateExpression) => {
  const { searchExpr, searchValues } = searchToWhereExpression(searchExpression)
  const { updateExpr, updateValues } = updateToSetExpression(searchExpression)

  await connection.execute(`UPDATE ${storageName} SET ${updateExpr} WHERE ${searchExpr}`, [
    ...updateValues,
    ...searchValues
  ])
}

const del = async ({ connection }, storageName, searchExpression) => {
  const { searchExpr, searchValues } = searchToWhereExpression(searchExpression)

  await connection.execute(`DELETE FROM ${storageName} WHERE ${searchExpr}`, searchValues)
}

export default {
  createStorage,
  dropStorage,
  insert,
  update,
  del
}
