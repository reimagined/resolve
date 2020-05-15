import RDSDataService from 'aws-sdk/clients/rdsdataservice'
import { KeyStoreOptions } from '../types'

type Value = {
  intValue?: number
  stringValue?: string
  bigIntValue?: number
  longValue?: number
  booleanValue?: boolean
  [key: string]: any
}

const coercer = (value: Value): any => {
  const {
    intValue,
    stringValue,
    bigIntValue,
    longValue,
    booleanValue,
    ...rest
  } = value
  if (intValue != null) {
    return Number(intValue)
  } else if (bigIntValue != null) {
    return Number(bigIntValue)
  } else if (longValue != null) {
    return Number(longValue)
  } else if (stringValue != null) {
    return String(stringValue)
  } else if (booleanValue != null) {
    return Boolean(booleanValue)
  } else {
    throw new Error(`Unknown type ${JSON.stringify(rest)}`)
  }
}

const executeStatement = async (
  rdsDataService: RDSDataService,
  options: KeyStoreOptions,
  sql: string
) => {
  const errors = []
  let rows = null

  try {
    const result = await rdsDataService
      .executeStatement({
        resourceArn: options.resourceArn,
        secretArn: options.secretArn,
        database: 'postgres',
        continueAfterTimeout: false,
        includeResultMetadata: true,
        sql
      })
      .promise()

    const { columnMetadata, records } = result

    if (Array.isArray(records) && columnMetadata != null) {
      rows = []
      for (const record of records) {
        const row: { [key: string]: any } = {}
        for (let i = 0; i < columnMetadata.length; i++) {
          const name = columnMetadata[i].name
          if (name != null) {
            row[name] = coercer(record[i])
          }
        }
        rows.push(row)
      }
    }
  } catch (error) {
    errors.push({ message: sql, stack: '' })
    errors.push(error)
  }

  if (errors.length > 0) {
    const error = new Error()
    error.message = errors.map(({ message }) => message).join('\n')
    error.stack = errors.map(({ stack }) => stack).join('\n')
    throw error
  }

  return rows
}

export default executeStatement
