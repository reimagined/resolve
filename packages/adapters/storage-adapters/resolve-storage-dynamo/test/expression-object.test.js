import expressionObject from '../src/expression-object'

describe('method "expressionObject"', () => {
  test('should return merge-object', () => {
    const result = expressionObject({ a: 5 }, { b: 10 }, {})

    expect(result).toEqual({
      a: 5,
      b: 10
    })
  })

  test('should return undefined', () => {
    const result = expressionObject({}, {})

    expect(result).toEqual(undefined)
  })
})
