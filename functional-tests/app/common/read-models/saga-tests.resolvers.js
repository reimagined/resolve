const resolvers = {
  getSucceededSagaTests: async (store) => {
    return await store.find('SagaTestRecords', {})
  },
}

export default resolvers
