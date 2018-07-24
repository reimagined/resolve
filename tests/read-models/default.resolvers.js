const resolvers = {
  NON_PARAMERTIZED_RESOLVER_TEST: async (store) => {
    const findResult = await store.find(
      'TestTable',                     // Table name
      { firstIndexName: { $gte: 1 } }, // Search condition
      { firstJsonName: 1 },            // Projection fields
      { secondFieldName: 1 },          // Sort fields
      10,                              // Skip documents
      100                              // Limit documents
    )
    
    const findOneResult = await store.findOne(
      'TestTable',                     // Table name
      { firstIndexName: { $gte: 1 } }, // Search condition
      { firstJsonName: 1 }             // Projection fields
    )
    
    const countResult = await store.count(
      'TestTable',                     // Table name
      { firstIndexName: { $gte: 1 } }  // Search condition
    )

    return {
      findResult,     // Array of documents, may be empty
      findOneResult,  // Document or null if not found
      countResult     // Matching documents count
    }
  },
  
  PARAMETRIZED_RESOLVER_TEST: async (store, args) => {
    const { firstFieldCondition, secondFieldCondition, pageNumber, pageLength } = args // Resolver arguments
    
    const searchCondition = { $or: [
        { firstFieldName: { $lte: firstFieldCondition } },
        { secondFieldName: { $gte: secondFieldCondition } }
    ] }
    
    const countResult = await store.count(
      'TestTable',                     
      searchCondition
    )
     
    const totalPages = countResult > 0 ? Math.floor((countResult - 1) / pageLength ) + 1 : 0
    const skip = Math.min(pageNumber, totalPages - 1) * pageLength
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
