export default {
  getSucceededSagaTests: async (store) => {
    return await store.find('SagaTestRecords', {})
  },
}
