const convertResultRow = (row, fieldList) => {
  if (fieldList != null && fieldList.constructor !== Object) {
    throw new Error(
      'Field list should be object with enumerated selected fields'
    )
  }

  for (const key of Object.keys(row)) {
    row[key] = row[key] != null ? JSON.parse(row[key]) : null
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

export default convertResultRow
