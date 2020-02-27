import { isAbsoluteUrl } from '../utils'

describe('isAbsoluteUrl', () => {
  test('some urls to test', () => {
    expect(isAbsoluteUrl('http://example.com')).toBeTruthy()
    expect(isAbsoluteUrl('HTTP://EXAMPLE.COM')).toBeTruthy()
    expect(isAbsoluteUrl('https://www.exmaple.com')).toBeTruthy()
    expect(isAbsoluteUrl('ftp://example.com/file.txt')).toBeTruthy()
    expect(isAbsoluteUrl('//cdn.example.com/lib.js')).toBeTruthy()
    expect(isAbsoluteUrl('/myfolder/test.txt')).toBeFalsy()
    expect(isAbsoluteUrl('test')).toBeFalsy()
  })
})
