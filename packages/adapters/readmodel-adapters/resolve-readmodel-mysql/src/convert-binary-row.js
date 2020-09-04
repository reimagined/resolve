const convertBinaryRow = (row, fieldList) => {
  if (fieldList != null && fieldList.constructor !== Object) {
    throw new Error(
      'Field list should be object with enumerated selected fields'
    )
  }

  Object.setPrototypeOf(row, Object.prototype)
  for (const key of Object.keys(row)) {
    if (key.endsWith('\u0004')) {
      delete row[key]
    }
  }

  if (fieldList == null) {
    return row
  }

  const fieldNames = Object.keys(fieldList)
  if (fieldNames.length === 0) {
    return row
  }

  const inclusiveMode = fieldList[fieldNames[0]] === 1
  for (const key of Object.keys(row)) {
    if (
      !(
        (inclusiveMode && fieldList.hasOwnProperty(key)) ||
        (!inclusiveMode && !fieldList.hasOwnProperty(key))
      )
    ) {
      delete row[key]
    }
  }

  return row
}

export default convertBinaryRow
