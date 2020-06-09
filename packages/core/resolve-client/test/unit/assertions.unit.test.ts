import { assertLeadingSlash } from '../../src/assertions'

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
