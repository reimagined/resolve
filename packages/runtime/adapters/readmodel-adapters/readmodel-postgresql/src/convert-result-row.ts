import type { ConvertResultRowMethod, RowLike } from './types'

const convertResultRow: ConvertResultRowMethod = (inputRow, fieldList) => {
  if (fieldList != null && fieldList.constructor !== Object) {
    throw new Error(
      'Field list should be object with enumerated selected fields'
    )
  }
  const row: RowLike = { ...inputRow }

  const fieldNames = fieldList != null ? Object.keys(fieldList) : []
  if (fieldList == null || fieldNames.length === 0) {
    return row
  }

  const inclusiveMode = fieldList[fieldNames[0]] === 1
  const resultRow: RowLike = {}

  for (const key of Object.keys(row)) {
    if (
      (inclusiveMode && fieldList.hasOwnProperty(key)) ||
      (!inclusiveMode && !fieldList.hasOwnProperty(key))
    ) {
      resultRow[key] = row[key]
    }
  }

  return resultRow
}

export default convertResultRow
