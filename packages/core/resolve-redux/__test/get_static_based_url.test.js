import sinon from 'sinon'

import getStaticBasedUrl from '../src/get_static_based_url'

describe('getStaticBasedUrl', () => {
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
      getStaticBasedUrl(
        'http://localhost:3000',
        'my-app',
        'assets',
        '/img/1.jpg'
      )
    ).toEqual('http://localhost:3000/my-app/assets/img/1.jpg')
  })

  test('should return normal URL', () => {
    expect(
      getStaticBasedUrl('http://localhost:3000', '', 'assets', '/img/1.jpg')
    ).toEqual('http://localhost:3000/assets/img/1.jpg')
  })

  test('should return absolute URL', () => {
    expect(
      getStaticBasedUrl(
        'http://localhost:3000',
        '',
        'assets',
        'https://cdn.localhost:3001/1.jpg'
      )
    ).toEqual('https://cdn.localhost:3001/1.jpg')

    // Regression test
    expect(
      getStaticBasedUrl(
        'http://localhost:3000',
        '',
        'http://localhost:3001',
        '/1.jpg'
      )
    ).toEqual('http://localhost:3001/1.jpg')

    // Regression test
    expect(
      getStaticBasedUrl(
        'http://localhost:3000',
        'my-app',
        'http://localhost:3001',
        '/2.jpg'
      )
    ).toEqual('http://localhost:3001/2.jpg')
  })

  test('should fail', () => {
    expect(() =>
      getStaticBasedUrl('http://localhost:3000', 'my-app', '', '/img/1.jpg')
    ).toThrow()

    expect(() =>
      getStaticBasedUrl('http://localhost:3000', 'my-app', '', '/img/1.jpg')
    ).toThrow()

    expect(() =>
      getStaticBasedUrl('http://localhost:3000', 'my-app', 'static', '')
    ).toThrow()

    expect(() =>
      getStaticBasedUrl('http://localhost:3000', '', 'static', '')
    ).toThrow()
  })
})
