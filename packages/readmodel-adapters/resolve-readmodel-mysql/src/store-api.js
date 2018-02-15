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

const searchToWhereExpression = expr => {
  const searchValues = []
  let searchExpr = ''

  // TODO

  return { searchExpr, searchValues }
}

const updateToSetExpression = expr => {
  const operators = Object.keys(expr).filter(key => key.indexOf('$') > -1)
  if (operators.length === 0) {
    return {
      updateExpr: Object.keys(expr)
        .map(fieldName => `${fieldName} = ?`)
        .join(', '),
      updateValues: Object.values(expr)
    }
  }

  const updateExprArray = []
  const updateValues = []
  for (let operatorName of operators) {
    const fieldName = Object.keys(operators[operatorName])[0]
    const fieldValue = operators[operatorName][fieldName]

    const [baseName, ...nestedPath] = fieldName.split('.')
    switch (operatorName) {
      case '$unset': {
        if (nestedPath.length === 0) {
          updateExprArray.push(
            `${baseName} = JSON_REMOVE(${baseName}, "$.${nestedPath.join('.')}"), `
          )
        } else {
          updateExprArray.push(`${baseName} = NULL, `)
        }
        break
      }

      case '$set': {
        if (nestedPath.length === 0) {
          updateExprArray.push(
            `${baseName} = JSON_SET(${baseName}, "$.${nestedPath.join('.')}", ?) , `
          )
        } else {
          updateExprArray.push(`${baseName} = ?, `)
        }
        updateValues.push(fieldValue)
        break
      }

      case '$inc': {
        if (nestedPath.length === 0) {
          updateExprArray.push(
            `${baseName} = JSON_SET(${baseName}, "$.${nestedPath.join(
              '.'
            )}", JSON_EXTRACT(${baseName}, "$.${nestedPath.join('.')}") + ?) , `
          )
        } else {
          updateExprArray.push(`${baseName} = ${baseName} + ?, `)
        }
        updateValues.push(fieldValue)
        break
      }

      default:
        break
    }
  }

  return {
    updateExpr: updateExprArray.join(', '),
    updateValues
  }
}

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
      return `${baseName}->>"$.${nestedPath.join('.')}" AS "${fieldName}"`
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
  find,
  insert,
  update,
  del
}
