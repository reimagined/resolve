export default {
  handlers: {
    SagaTestRequested: async (
      { sideEffects: { isEnabled, executeCommand } },
      { aggregateId, aggregateVersion, payload: { testId } }
    ) => {
      // TODO: remove it
      console.log(`${aggregateVersion} side effects enabled: ${isEnabled}`)

      await executeCommand({
        type: 'succeedSagaTest',
        aggregateId,
        aggregateName: 'saga-test',
        payload: { testId },
      })
    },
  },
}
