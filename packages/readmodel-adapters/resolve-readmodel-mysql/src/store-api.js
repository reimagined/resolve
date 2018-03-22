const MAX_VALUE = 0x0fffffff | 0
const castType = type => {
  switch (type) {
    case 'number':
      return 'BIGINT NOT NULL'
    case 'string':
      return 'VARCHAR(255) NOT NULL'
    case 'json':
      return 'JSON NULL'
    default:
      return 'VARCHAR(255) NOT NULL'
  }
}

const defineStorage = async ({ connection }, storageName, storageSchema) => {
  await connection.execute(
    `CREATE TABLE ${storageName} (\n` +
      [
        Object.keys(storageSchema.fieldTypes)
          .map(
            fieldName =>
              `${fieldName} ${castType(storageSchema.fieldTypes[fieldName])}`
          )
          .join(',\n'),
        [
          `PRIMARY KEY (${storageSchema.primaryIndex.name})`,
          ...storageSchema.secondaryIndexes.map(
            ({ name }) => `INDEX USING BTREE (${name})`
          )
        ].join(',\n')
      ].join(',\n') +
      `\n)`
  )
}

const makeNestedPath = nestedPath =>
  `$.${nestedPath.map(JSON.stringify).join('.')}`

const searchToWhereExpression = expr => {
  return {
    searchExpr: Object.keys(expr)
      .map(fieldName => {
        const [baseName, ...nestedPath] = fieldName.split('.')
        if (nestedPath.length === 0) return `${baseName} = ?`
        return `${baseName}->>'${makeNestedPath(nestedPath)}' = ?`
      })
      .join(' AND '),

    searchValues: Object.values(expr)
  }
}

const updateToSetExpression = expr => {
  const updateExprArray = []
  const updateValues = []

  for (let operatorName of Object.keys(expr)) {
    for (let fieldName of Object.keys(expr[operatorName])) {
      const fieldValue = expr[operatorName][fieldName]
      const [baseName, ...nestedPath] = fieldName.split('.')

      switch (operatorName) {
        case '$unset': {
          if (nestedPath.length > 0) {
            updateExprArray.push(
              `${baseName} = JSON_REMOVE(${baseName}, '${makeNestedPath(
                nestedPath
              )}') `
            )
          } else {
            updateExprArray.push(`${baseName} = NULL `)
          }
          break
        }

        case '$set': {
          if (nestedPath.length > 0) {
            updateExprArray.push(
              `${baseName} = JSON_SET(${baseName}, '${makeNestedPath(
                nestedPath
              )}', ?) `
            )
          } else {
            updateExprArray.push(`${baseName} = ? `)
          }
          updateValues.push(fieldValue)
          break
        }

        case '$inc': {
          if (nestedPath.length > 0) {
            updateExprArray.push(
              `${baseName} = JSON_SET(${baseName}, '${makeNestedPath(
                nestedPath
              )}', JSON_EXTRACT(${baseName}, '${makeNestedPath(
                nestedPath
              )}') + ?) `
            )
          } else {
            updateExprArray.push(`${baseName} = ${baseName} + ? `)
          }
          updateValues.push(fieldValue)
          break
        }

        default:
          break
      }
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
  let selectExpression =
    fieldList && Object.keys(fieldList).length > 0
      ? Object.keys(fieldList)
          .filter(fieldName => fieldList[fieldName] === 1)
          .map(fieldName => {
            const [baseName, ...nestedPath] = fieldName.split('.')
            if (nestedPath.length === 0) return baseName
            return `${baseName}->>'${makeNestedPath(
              nestedPath
            )}' AS "${fieldName}"`
          })
          .join(', ')
      : '*'

  if (selectExpression.trim() === '') {
    selectExpression = 'NULL'
  }

  const orderExpression =
    sort && Object.keys(sort).length > 0
      ? 'ORDER BY ' +
        Object.keys(sort)
          .map(fieldName => {
            const [baseName, ...nestedPath] = fieldName.split('.')
            const provisionedName =
              nestedPath.length === 0
                ? baseName
                : `${baseName}->>'${makeNestedPath(nestedPath)}'`
            return sort[fieldName] > 0
              ? `${provisionedName} ASC`
              : `${provisionedName} DESC`
          })
          .join(', ')
      : ''

  const skipLimit = `LIMIT ${isFinite(skip) ? skip : 0},${
    isFinite(limit) ? limit : MAX_VALUE
  }`

  const { searchExpr, searchValues } = searchToWhereExpression(searchExpression)

  const inlineSearchExpr =
    searchExpr.trim() !== '' ? `WHERE ${searchExpr} ` : ''

  const [rows] = await connection.execute(
    `SELECT ${selectExpression} FROM ${storageName}
    ${inlineSearchExpr}
    ${orderExpression}
    ${skipLimit}
  `,
    searchValues
  )

  return rows
}

const findOne = async (
  { connection },
  storageName,
  searchExpression,
  fieldList
) => {
  let selectExpression =
    fieldList && Object.keys(fieldList).length > 0
      ? Object.keys(fieldList)
          .filter(fieldName => fieldList[fieldName] === 1)
          .map(fieldName => {
            const [baseName, ...nestedPath] = fieldName.split('.')
            if (nestedPath.length === 0) return baseName
            return `${baseName}->>'${makeNestedPath(
              nestedPath
            )}' AS "${fieldName}"`
          })
          .join(', ')
      : '*'

  if (selectExpression.trim() === '') {
    selectExpression = 'NULL'
  }

  const { searchExpr, searchValues } = searchToWhereExpression(searchExpression)

  const inlineSearchExpr =
    searchExpr.trim() !== '' ? `WHERE ${searchExpr} ` : ''

  const [rows] = await connection.execute(
    `SELECT ${selectExpression} FROM ${storageName}
    ${inlineSearchExpr}
    LIMIT 0, 1
  `,
    searchValues
  )

  if (Array.isArray(rows) && rows.length > 0) {
    return rows[0]
  }

  return null
}

const count = async ({ connection }, storageName, searchExpression) => {
  const { searchExpr, searchValues } = searchToWhereExpression(searchExpression)

  const inlineSearchExpr =
    searchExpr.trim() !== '' ? `WHERE ${searchExpr} ` : ''

  const [rows] = await connection.execute(
    `SELECT Count(*) AS Count FROM ${storageName}
    ${inlineSearchExpr}
  `,
    searchValues
  )

  if (
    Array.isArray(rows) &&
    rows.length > 0 &&
    rows[0] &&
    Number.isInteger(+rows[0].Count)
  ) {
    return +rows[0].Count
  }

  return 0
}

const insert = async ({ connection }, storageName, document) => {
  await connection.execute(
    `INSERT INTO ${storageName}(${Object.keys(document).join(', ')})
     VALUES(${Object.keys(document)
       .map(_ => '?')
       .join(', ')})
    `,
    Object.values(document)
  )
}

const update = async (
  { connection },
  storageName,
  searchExpression,
  updateExpression
) => {
  const { searchExpr, searchValues } = searchToWhereExpression(searchExpression)
  const { updateExpr, updateValues } = updateToSetExpression(updateExpression)

  const inlineSearchExpr =
    searchExpr.trim() !== '' ? `WHERE ${searchExpr} ` : ''

  await connection.execute(
    `UPDATE ${storageName} SET ${updateExpr} ${inlineSearchExpr}`,
    [...updateValues, ...searchValues]
  )
}

const del = async ({ connection }, storageName, searchExpression) => {
  const { searchExpr, searchValues } = searchToWhereExpression(searchExpression)

  const inlineSearchExpr =
    searchExpr.trim() !== '' ? `WHERE ${searchExpr} ` : ''

  await connection.execute(
    `DELETE FROM ${storageName} ${inlineSearchExpr}`,
    searchValues
  )
}

export default {
  defineStorage,
  find,
  findOne,
  count,
  insert,
  update,
  del
}
