import type { ConvertBinaryRowMethod, RowLike } from './types'

const excludeObjectField = <
  FromType extends object,
  ToType extends object,
  Key extends keyof any
>(
  input: FromType,
  keyLike: Key | Array<Key>
): ToType => {
  const key = Array.isArray(keyLike) ? keyLike[0] : keyLike
  const { [key]: excludedKey, ...result } = input as any
  void excludedKey
  if (Array.isArray(keyLike) && keyLike.length > 1) {
    return excludeObjectField(result, keyLike.slice(1))
  } else {
    return result
  }
}

const convertBinaryRow: ConvertBinaryRowMethod = (inputRow, fieldList) => {
  if (fieldList != null && fieldList.constructor !== Object) {
    throw new Error(
      'Field list should be object with enumerated selected fields'
    )
  }
  const row: RowLike = excludeObjectField(
    inputRow,
    Object.keys(inputRow).filter((key) => key.endsWith('\u0004'))
  )

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
