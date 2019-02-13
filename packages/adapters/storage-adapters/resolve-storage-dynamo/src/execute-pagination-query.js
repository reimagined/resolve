const executePaginationQuery = async (
  { documentClient, executeSingleQuery, decodeEmptyStrings },
  query,
  callback
) => {
  let res
  do {
    res = await executeSingleQuery(documentClient, query)

    query.ExclusiveStartKey = res.LastEvaluatedKey

    for (const event of res.Items) {
      await callback(decodeEmptyStrings(event))
    }
  } while (res.LastEvaluatedKey != null)
}

export default executePaginationQuery
