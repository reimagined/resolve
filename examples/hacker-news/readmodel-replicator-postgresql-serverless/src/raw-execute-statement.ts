import type { JsonLike } from './types'

const rawExecuteStatement = async (
  rdsDataService: any,
  dbClusterOrInstanceArn: string,
  awsSecretStoreArn: string,
  coercer: Function,
  sql: string
) => {
  console.log('SQL:', sql)

  const result = await rdsDataService.executeStatement({
    resourceArn: dbClusterOrInstanceArn,
    secretArn: awsSecretStoreArn,
    database: 'postgres',
    continueAfterTimeout: false,
    includeResultMetadata: true,
    sql,
  })

  const { columnMetadata, records } = result

  if (!Array.isArray(records) || columnMetadata == null) {
    return []
  }

  const rows: Array<object> = []
  for (const record of records) {
    const row: Record<string, JsonLike> = {}
    for (let i = 0; i < columnMetadata.length; i++) {
      const columnName = columnMetadata[i].name
      if (columnName != null) {
        row[columnName] = coercer(record[i])
      }
    }
    rows.push(row)
  }

  return rows
}

export default rawExecuteStatement
