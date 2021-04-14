export default {
  getSucceededSagaSchedulerTests: async (store, { id }) => {
    return await store.findOne('SagaSchedulerTestRecords', { id })
  },
}
