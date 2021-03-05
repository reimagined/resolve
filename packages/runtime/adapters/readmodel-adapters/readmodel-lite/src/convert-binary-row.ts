import type { ConvertBinaryRowMethod, RowLike } from './types'

const excludeObjectField = <
  FromType extends object,
  ToType extends object,
  Key extends keyof any
>(
  input: FromType,
  key: Key
): ToType => {
  const { [key]: excludedKey, ...result } = input as any
  void excludedKey
  return result
}

const convertBinaryRow: ConvertBinaryRowMethod = (
  inputRow,
  readModelName,
  fieldList
) => {
  if (fieldList != null && fieldList.constructor !== Object) {
    throw new Error(
      'Field list should be object with enumerated selected fields'
    )
  }
  const row: RowLike = excludeObjectField(inputRow, `RESOLVE-${readModelName}`)

  for (const key of Object.keys(row)) {
    row[key] = JSON.parse(
      String(row[key])
        .replace(/\u001a2/g, '.')
        .replace(/\u001a1/g, '"')
        .replace(/\u001a0/g, '\u001a')
    )
  }

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

export default convertBinaryRow
