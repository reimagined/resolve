import sinon from 'sinon'

import checkTableExists from '../src/check-table-exists'

describe('method "checkTableExists"', () => {
  test('should return true', async () => {
    const tableName = 'tableName'
    const database = {
      describeTable: sinon.stub().returns({
        promise: sinon.stub().returns(
          Promise.resolve({
            Table: {
              TableStatus: 'ACTIVE'
            }
          })
        )
      })
    }

    const result = await checkTableExists(database, tableName)
    expect(result).toEqual(true)
  })

  test('should return true [recursive]', async () => {
    const promise = sinon.stub()

    promise.onCall(0).returns(
      Promise.resolve({
        Table: {
          TableStatus: 'UPDATING'
        }
      })
    )
    promise.returns(
      Promise.resolve({
        Table: {
          TableStatus: 'ACTIVE'
        }
      })
    )

    const tableName = 'tableName'
    const database = {
      describeTable: sinon.stub().returns({
        promise
      })
    }

    const result = await checkTableExists(database, tableName)
    expect(result).toEqual(true)
  })

  test('should return false', async () => {
    const tableName = 'tableName'
    const database = {
      describeTable: sinon.stub().returns({
        promise: sinon.stub().returns(Promise.reject())
      })
    }

    const result = await checkTableExists(database, tableName)
    expect(result).toEqual(false)
  })
})
