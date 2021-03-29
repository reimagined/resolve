export default {
  handlers: {
    Init: async ({ store }) => {
      await store.defineTable('SagaTestRecordsInSaga', {
        indexes: { id: 'string' },
      })
    },
    SagaTestRequested: async (
      { store, sideEffects: { isEnabled, executeCommand } },
      { aggregateId, aggregateVersion, payload: { testId } }
    ) => {
      // TODO: remove it
      console.log(`${aggregateVersion} side effects enabled: ${isEnabled}`)

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
