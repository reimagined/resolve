import win from 'global/window'
import determineOrigin from '../../src/determine-origin'

afterEach(() => {
  delete win.location
})

test('SSR: undefined origin and no window', () => {
  expect(determineOrigin(undefined)).toEqual('')
})

test('browser: undefined origin and a window with location', () => {
  win.location = {
    protocol: 'http:',
    hostname: 'www.host.com',
    port: '8080',
  }

  expect(determineOrigin(undefined)).toEqual('http://www.host.com:8080')
})

test('browser: port is not defined', () => {
  win.location = {
    protocol: 'http:',
    hostname: 'www.host.com',
  }

  expect(determineOrigin(undefined)).toEqual('http://www.host.com')
})

test('browser: window.location is string (somehow)', () => {
  win.location = 'http://funny.things.org:10'

  expect(determineOrigin(undefined)).toEqual('http://funny.things.org:10')
})

test('custom: origin as string', () => {
  win.location = {
    protocol: 'http:',
    hostname: 'www.host.com',
    port: '8080',
  }

  expect(determineOrigin('http://my.custom.com:2020')).toEqual(
    'http://my.custom.com:2020'
  )
})

test('custom: origin as Location', () => {
  win.location = {
    protocol: 'http:',
    hostname: 'www.host.com',
    port: '8080',
  }

  expect(
    determineOrigin({
      protocol: 'https:',
      hostname: 'www.custom.com',
      port: '80',
    })
  ).toEqual('https://www.custom.com:80')
})

test('custom: origin as Location without port', () => {
  win.location = {
    protocol: 'http:',
    hostname: 'www.host.com',
    port: '8080',
  }

  expect(
    determineOrigin({
      protocol: 'https:',
      hostname: 'www.custom.com',
    })
  ).toEqual('https://www.custom.com')
})
