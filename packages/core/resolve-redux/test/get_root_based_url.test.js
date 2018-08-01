import sinon from 'sinon'

import getRootBasedUrl from '../src/get_root_based_url'

describe('getRootBasedUrl', () => {
  let sandbox

  beforeAll(() => {
    sandbox = sinon.createSandbox()
    sandbox.stub(console, 'error')
  })

  afterAll(() => {
    sandbox.restore()
  })

  test('should return root based URL', () => {
    expect(
      getRootBasedUrl('http://localhost:3000', 'my-app', '/api/query')
    ).toEqual('http://localhost:3000/my-app/api/query')
  })

  test('should return normal URL', () => {
    expect(getRootBasedUrl('http://localhost:3000', '', '/api/query')).toEqual(
      'http://localhost:3000/api/query'
    )
  })

  test('should return absolute URL', () => {
    expect(
      getRootBasedUrl(
        'http://localhost:3000',
        '',
        'https://localhost:3001/api/query'
      )
    ).toEqual('https://localhost:3001/api/query')
  })

  test('should fail', () => {
    expect(() =>
      getRootBasedUrl('http://localhost:3000', 'my-app', '')
    ).toThrow()

    expect(() => getRootBasedUrl('http://localhost:3000', '', '')).toThrow()
  })
})
