import sinon from 'sinon'
import getClientJsPath from '../src/runtime/server/utils/get_client_js_path'

describe('getClientJsPath', () => {
  let sandbox

  beforeAll(() => {
    sandbox = sinon.createSandbox()
    sandbox.stub(console, 'error')
  })

  afterAll(() => {
    sandbox.restore()
  })

  test('should return normal URL', () => {
    expect(getClientJsPath('assets')).toEqual('assets/client.js')
  })

  test('should return absolute URL', () => {
    expect(getClientJsPath('https://cdn.localhost:3001')).toEqual(
      'https://cdn.localhost:3001/client.js'
    )
  })

  test('should fail', () => {
    expect(() => getClientJsPath('')).toThrow()

    expect(() => getClientJsPath(1234)).toThrow()
  })
})
