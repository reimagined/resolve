import {
  assertLeadingSlash,
  isAbsoluteUrl,
  getStaticBasedPath,
  jsonDeserializeState,
  jsonSerializeState,
} from '../src/helpers'
import { IS_BUILT_IN } from '../src/symbols'

describe('assertLeadingSlash', () => {
  let spy: jest.SpiedFunction<any>
  beforeAll(() => {
    spy = jest.spyOn(console, 'error').mockImplementation((): void => {
      /* do nothing */
    })
  })

  afterAll(() => {
    spy.mockRestore()
  })

  test('value values', () => {
    assertLeadingSlash('/path')
    assertLeadingSlash('/../path')
    assertLeadingSlash('//path')
  })

  test('invalid values', () => {
    expect(() => assertLeadingSlash('path')).toThrow()
    expect(() => assertLeadingSlash(' /path')).toThrow()
    expect(() => assertLeadingSlash('\\path')).toThrow()
    expect(() => assertLeadingSlash('')).toThrow()
    expect(() => assertLeadingSlash(' ')).toThrow()
  })
})

describe('isAbsoluteUrl', () => {
  test('some urls to test', () => {
    expect(isAbsoluteUrl('http://example.com')).toBeTruthy()
    expect(isAbsoluteUrl('HTTP://EXAMPLE.COM')).toBeTruthy()
    expect(isAbsoluteUrl('https://www.example.com')).toBeTruthy()
    expect(isAbsoluteUrl('ftp://example.com/file.txt')).toBeTruthy()
    expect(isAbsoluteUrl('//cdn.example.com/lib.js')).toBeTruthy()
    expect(isAbsoluteUrl('/some-folder/test.txt')).toEqual(false)
    expect(isAbsoluteUrl('test')).toEqual(false)
  })
})

describe('getStaticBasedPath', () => {
  test('some paths to test', () => {
    expect(getStaticBasedPath('', 'static', 'index.js')).toEqual(
      '/static/index.js'
    )
    expect(
      getStaticBasedPath('', 'https://static.resolve.fit/app', 'index.js')
    ).toEqual('https://static.resolve.fit/app/index.js')
    expect(
      getStaticBasedPath('', 'https://static.resolve.fit/app/', 'index.js')
    ).toEqual('https://static.resolve.fit/app/index.js')
  })
})

describe('jsonDeserializeState', () => {
  test('should have IS_BUILT_IN field set', () => {
    expect(jsonDeserializeState[IS_BUILT_IN]).toEqual(true)
  })
})

describe('jsonSerializeState', () => {
  test('should have IS_BUILT_IN field set', () => {
    expect(jsonSerializeState[IS_BUILT_IN]).toEqual(true)
  })
})

