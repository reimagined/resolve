import checkStoredTableSchema from '../src/check-table-schema'

describe('resolve-readmodel-base check-table-schema', () => {
  it('should pass good table name and description', () => {
    expect(
      checkStoredTableSchema('Tablename', {
        primary: 'primary-number',
        secondary: 'secondary-string',
        normal: 'regular'
      })
    ).toEqual(true)
  })
})
