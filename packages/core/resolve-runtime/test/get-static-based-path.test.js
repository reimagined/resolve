import sinon from 'sinon'
import getStaticBasedPath from '../src/common/utils/get-static-based-path'

describe('getStaticBasedPath', () => {
  let sandbox

  beforeAll(() => {
    sandbox = sinon.createSandbox()
    sandbox.stub(console, 'error')
  })

  afterAll(() => {
    sandbox.restore()
  })

  test('should return normal URL', () => {
    expect(getStaticBasedPath('rootPath', 'assets', 'client.js')).toEqual(
      '/rootPath/assets/client.js'
    )
  })

  test('should return absolute URL', () => {
    expect(
      getStaticBasedPath('rootPath', 'https://cdn.localhost:3001', 'client.js')
    ).toEqual('https://cdn.localhost:3001/client.js')
  })

  test('should fail', () => {
    expect(() => getStaticBasedPath('rootPath', 'static', '')).toThrow()

    expect(() => getStaticBasedPath('rootPath', '', 'client.js')).toThrow()

    expect(() => getStaticBasedPath('rootPath', 1234, 'client.js')).toThrow()
  })
})
