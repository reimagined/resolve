const convertBinaryRow = (row, readModelName, fieldList) => {
  if (fieldList != null && fieldList.constructor !== Object) {
    throw new Error(
      'Field list should be object with enumerated selected fields'
    )
  }

  Object.setPrototypeOf(row, Object.prototype)
  delete row[`RESOLVE-${readModelName}`]
  for (const key of Object.keys(row)) {
    row[key] = JSON.parse(
      String(row[key])
        .replace(/\u001a2/g, '.')
        .replace(/\u001a1/g, '"')
        .replace(/\u001a0/g, '\u001a')
    )
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
