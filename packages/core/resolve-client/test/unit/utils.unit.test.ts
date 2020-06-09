import { isAbsoluteUrl } from '../../src/utils'

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
