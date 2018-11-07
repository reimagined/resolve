import sinon from 'sinon'

import dispose from '../src/dispose'

describe('method "dispose"', async () => {
  test('should call database.deleteTable', async () => {
    const tableName = 'tableName'
    const database = {
      deleteTable: sinon.stub()
    }

    await dispose(
      {
        database,
        tableName
      },
      { dropEvents: true }
    )

    sinon.assert.calledWith(database.deleteTable, { TableName: tableName })
  })

  test('should do nothing', async () => {
    const tableName = 'tableName'
    const database = {
      deleteTable: sinon.stub()
    }

    await dispose(
      {
        database,
        tableName
      },
      { dropEvents: false }
    )

    sinon.assert.notCalled(database.deleteTable)
  })
})
