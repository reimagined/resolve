export default {
  requestSagaTest: (_, { payload }) => ({
    type: 'SagaTestRequested',
    payload,
  }),
  succeedSagaTest: (_, { payload }) => ({
    type: 'SagaTestSucceeded',
    payload,
  }),
}
