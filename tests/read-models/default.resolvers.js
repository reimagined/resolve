const resolvers = {
  NON_PARAMETERIZED_RESOLVER_TEST: async store => {
    const searchExpression = { firstIndexName: { $gte: 1 } }
    const projectionExpression = { firstJsonName: 1 }
    const sortExpression = { secondFieldName: 1 }
    const skipValue = 1
    const limitValue = 10

    const findResult = await store.find(
      'TestTable',
      searchExpression,
      projectionExpression,
      sortExpression,
      skipValue,
      limitValue
    )

    const findOneResult = await store.findOne(
      'TestTable',
      searchExpression,
      projectionExpression
    )

    const countResult = await store.count('TestTable', searchExpression)

    return {
      findResult,
      findOneResult,
      countResult
    }
  },

  PARAMETRIZED_RESOLVER_TEST: async (store, args) => {
    const {
      firstFieldCondition,
      secondFieldCondition,
      pageNumber,
      pageLength
    } = args

    const searchCondition = {
      $or: [
        { firstFieldName: { $lte: firstFieldCondition } },
        { secondFieldName: { $gte: secondFieldCondition } }
      ]
    }

    const countResult = await store.count('TestTable', searchCondition)

    const totalPages =
      countResult > 0 ? Math.floor((countResult - 1) / pageLength) + 1 : 0

    const skip = Math.max(0, Math.min(pageNumber, totalPages - 1)) * pageLength
    const limit = pageLength

    const findResult = await store.find(
      'TestTable',
      searchCondition,
      { firstJsonName: 1 },
      { firstFieldName: 1, secondFieldName: 1 },
      skip,
      limit
    )

    return findResult
  }
}

export default resolvers
