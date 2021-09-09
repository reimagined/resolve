import { prepareDomain } from '../../src/local/prepare-domain'
import type { ApiHandler, Resolve } from '../../types/common/types'

const emptyDomain = (): Resolve['domain'] => ({
  aggregates: [],
  readModels: [],
  sagas: [],
  viewModels: [],
  apiHandlers: [],
})

describe('event subscriber API handler', () => {
  const findHandler = (domain: Resolve['domain']): ApiHandler | undefined =>
    domain.apiHandlers.find(
      (handler) => handler.path === '/api/subscribers/:eventSubscriber'
    )

  test('valid path and method', () => {
    const domain = prepareDomain(emptyDomain())
    const handler = findHandler(domain)
    expect(handler).toBeDefined()
    expect(handler?.method).toEqual('GET')
    expect(handler?.handler).toEqual(expect.any(Function))
  })
})
