import reset from '../../src/local/api-handlers/reset-domain-handler'

const acquireMiddleware = (options) => reset(options)

const getMockResolve = () => ({
  eventstoreAdapter: {},
  publisher: {},
  domain: { readModels: [], sagas: [] },
  eventSubscriber: {
    reset: () => {},
  },
  domainInterop: {
    sagaDomain: {
      createSagas: jest.fn(),
      getSagasSchedulersInfo: jest.fn(() => []),
    },
  },
})
const getMockResponse = () => ({
  end: jest.fn(),
  status: jest.fn(),
})

// https://github.com/reimagined/resolve/issues/1432
test('bug-fix: permanent 500 error on read-models/sagas reset error if dropEventSubscriber set to false', async () => {
  const handler = acquireMiddleware({
    dropEventStore: false,
    dropEventSubscriber: false,
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
