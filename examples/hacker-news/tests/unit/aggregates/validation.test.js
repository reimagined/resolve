import validate from '../../../common/aggregates/validation'

describe('validation', () => {
  it('stateIsAbsent', () => {
    expect(() =>
      validate.stateIsAbsent({ some: 'field' }, 'Object')
    ).toThrowError('Object already exists')
  })

  it('stateExists', () => {
    expect(() => validate.stateExists({}, 'Object')).toThrowError(
      'Object does not exist'
    )
  })

  it('fieldRequired', () => {
    expect(() => validate.fieldRequired({}, 'name')).toThrowError(
      'The "name" field is required'
    )
  })

  it('itemIsNotInArray', () => {
    expect(() => validate.itemIsNotInArray(['a'], 'a')).toThrowError(
      'Item is already in array'
    )
  })

  it('itemIsNotInArray with custom message', () => {
    expect(() =>
      validate.itemIsNotInArray(['a'], 'a', 'a is already in array')
    ).toThrowError('a is already in array')
  })

  it('itemIsInArray', () => {
    expect(() => validate.itemIsInArray([], 'a')).toThrowError(
      'Item is not in array'
    )
  })

  it('itemIsInArray with custom itemIsInArray', () => {
    expect(() =>
      validate.itemIsInArray([], 'a', '"a" is not in array')
    ).toThrowError('"a" is not in array')
  })

  it('keyIsNotInObject', () => {
    expect(() =>
      validate.keyIsNotInObject({ some: 'field' }, 'some')
    ).toThrowError('Key is already in object')
  })

  it('keyIsNotInObject with custom message', () => {
    expect(() =>
      validate.keyIsNotInObject(
        { some: 'field' },
        'some',
        '"some" is already in object'
      )
    ).toThrowError('"some" is already in object')
  })
})
