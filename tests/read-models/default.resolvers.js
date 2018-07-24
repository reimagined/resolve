const resolvers = {
  RESOLVER_TEST: async (store, args) => {
    const simpleFind = await store.find(
      'TestTable',
      { firstIndexName: { $gte: 1 } },
      { firstJsonName: 1 },
      { secondFieldName: 1 }
    )

    return {
      simpleFind,
      args
    }
  }
}

export default resolvers
