const saga = {
  handlers: {
    SagaSchedulerRequested: async (
      { sideEffects: { scheduleCommand } },
      { aggregateId, payload: { testId } }
    ) => {
      await scheduleCommand(Date.now() + 100, {
        type: 'succeedSagaSchedulerTest',
        aggregateName: 'scheduler-test',
        aggregateId,
        payload: {
          testId,
        },
      })
    },
  },
}
export default saga
