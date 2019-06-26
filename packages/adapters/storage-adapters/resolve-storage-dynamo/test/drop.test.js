import drop from '../src/drop'

describe('method "drop"', () => {
  test('should drop table', async () => {
    const deleteTablePromise = jest.fn()
    const tableName = 'tableName'
    const database = {
      deleteTable: jest.fn().mockReturnValue({
        promise: deleteTablePromise
      })
    }

    await drop({
      database,
      tableName
    })

    expect(database.deleteTable).toBeCalledWith({ TableName: tableName })
    expect(deleteTablePromise).toBeCalledWith()
  })
})
