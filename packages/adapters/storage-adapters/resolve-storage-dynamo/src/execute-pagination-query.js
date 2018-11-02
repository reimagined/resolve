const executePaginationQuery = async (
  { documentClient, executeSingleQuery },
  query,
  callback
) => {
  let res
  do {
    res = await executeSingleQuery(documentClient, query)

    query.ExclusiveStartKey = res.LastEvaluatedKey

    for (const event of res.Items) {
      await callback(event)
    }
  } while (res.hasOwnProperty('LastEvaluatedKey'))
}

export default executePaginationQuery
