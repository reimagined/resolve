import reset from '../../src/local/reset-domain-handler'

const acquireMiddleware = (options) => reset(options)

const getMockResolve = () => ({
  eventstoreAdapter: {},
  publisher: {},
  readModels: [],
  sagas: [],
  eventBus: {
    reset: () => {},
  },
})
const getMockResponse = () => ({
  end: jest.fn(),
  status: jest.fn(),
})

// https://github.com/reimagined/resolve/issues/1432
test('bug-fix: permanent 500 error on read-models/sagas reset error if dropEventBus set to false', async () => {
  const handler = acquireMiddleware({
    dropEventStore: false,
    dropEventBus: false,
    dropSagas: true,
    dropReadModels: true,
  })
  const res = getMockResponse()
  const req = {
    resolve: getMockResolve(),
  }

  await handler(req, res)

  expect(res.end).toHaveBeenCalledWith('ok')
})
