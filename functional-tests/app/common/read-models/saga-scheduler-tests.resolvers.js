const resolvers = {
  getSucceededSagaSchedulerTests: async (store, { id }) => {
    return await store.findOne('SagaSchedulerTestRecords', { id })
  },
}

export default resolvers
