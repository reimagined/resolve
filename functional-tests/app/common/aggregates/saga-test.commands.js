const aggregate = {
  requestSagaTest: (_, { payload }) => ({
    type: 'SagaTestRequested',
    payload,
  }),
  succeedSagaTest: (_, { payload }) => ({
    type: 'SagaTestSucceeded',
    payload,
  }),
}

export default aggregate
