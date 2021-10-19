const saga = {
  handlers: {
    Init: async ({ store }) => {
      await store.defineTable('SagaTestRecordsInSaga', {
        indexes: { id: 'string' },
        fields: [],
      })
    },
    SagaTestRequested: async (
      { store, sideEffects: { executeCommand } },
      { aggregateId, payload: { testId } }
    ) => {
      await executeCommand({
        type: 'succeedSagaTest',
        aggregateId,
        aggregateName: 'saga-test',
        payload: {
          testId,
          counterId: await store.count('SagaTestRecordsInSaga', {}),
        },
      })

      await store.insert('SagaTestRecordsInSaga', {
        id: testId,
      })
    },
  },
}

export default saga
