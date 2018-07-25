import createJwtReducer from '../src/create_jwt_reducer'

describe('createJwtReducer', () => {
  test('should return correctly reducer', () => {
    const state = {}
    const reducer = createJwtReducer()

    expect(reducer(state)).toEqual(state)
  })
})
