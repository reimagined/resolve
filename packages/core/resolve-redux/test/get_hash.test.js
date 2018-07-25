import getHash from '../src/get_hash'

describe('getHash', () => {
  test('string should work correctly', () => {
    expect(getHash('ABC')).toMatchSnapshot()
  })

  test('number should work correctly', () => {
    expect(getHash(123)).toMatchSnapshot()
  })

  test('boolean should work correctly', () => {
    expect(getHash(true)).toMatchSnapshot()
  })

  test('empty object should work correctly', () => {
    expect(getHash({})).toMatchSnapshot()
  })

  test('empty array should work correctly', () => {
    expect(getHash([])).toMatchSnapshot()
  })

  test('ordered object should work correctly', () => {
    expect(getHash({ a: 1, b: 2, c: 3 })).toMatchSnapshot()
  })

  test('ordered should work correctly', () => {
    expect(getHash([1, 2, 3])).toMatchSnapshot()
  })

  test('disordered object should work correctly', () => {
    expect(getHash({ c: 1, b: 2, a: 3 })).toMatchSnapshot()
  })

  test('disordered array should work correctly', () => {
    expect(getHash([3, 2, 1])).toMatchSnapshot()
  })
})
