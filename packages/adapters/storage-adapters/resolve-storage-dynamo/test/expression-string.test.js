import expressionString from '../src/expression-string'

describe('method "expressionString"', () => {
  test('should return concat-string', () => {
    const result = expressionString('#a = :a', '#b = :b', '')

    expect(result).toEqual('#a = :a AND #b = :b')
  })

  test('should return undefined', () => {
    const result = expressionString('', '', '')

    expect(result).toEqual(undefined)
  })
})
