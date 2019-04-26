const buildUpsertDocument = (searchExpression, updateExpression) => {
  const isSearchDocument =
    Object.keys(searchExpression).filter(key => key.indexOf('$') > -1)
      .length === 0

  const baseDocument = {
    ...(isSearchDocument ? searchExpression : {}),
    ...(updateExpression['$set'] || {})
  }

  const resultDocument = {}

  for (const key of Object.keys(baseDocument)) {
    const nestedKeys = key.split('.')
    nestedKeys.reduce(
      (acc, val, idx) =>
        acc.hasOwnProperty(val)
          ? acc[val]
          : (acc[val] = isNaN(Number(nestedKeys[idx + 1]))
              ? nestedKeys.length - 1 === idx
                ? baseDocument[key]
                : {}
              : []),
      resultDocument
    )
  }

  return resultDocument
}

export default buildUpsertDocument
