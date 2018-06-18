import { expect } from 'chai'
import sinon from 'sinon'

import checkStoreApi from '../src/check-store-api'
import messages from '../src/messages'

describe('resolve-readmodel-base check-store-api', () => {
  let storeApi, metaApi, api

  beforeEach(() => {
    storeApi = {
      defineTable: sinon.stub(),
      find: sinon.stub(),
      findOne: sinon.stub(),
      count: sinon.stub(),
      insert: sinon.stub(),
      update: sinon.stub(),
      del: sinon.stub()
    }
    metaApi = {
      getMetaInfo: sinon.stub(),
      getLastTimestamp: sinon.stub(),
      setLastTimestamp: sinon.stub(),
      tableExists: sinon.stub(),
      getTableInfo: sinon.stub(),
      describeTable: sinon.stub(),
      getTableNames: sinon.stub(),
      drop: sinon.stub()
    }

    api = checkStoreApi({ metaApi, storeApi })
  })

  afterEach(() => {
    storeApi = null
    metaApi = null
    api = null
  })

  const fieldsInputDeclaration = {
    indexes: {
      id: 'string',
      volume: 'number',
      timestamp: 'number'
    },
    fields: ['content']
  }

  const fieldsOutputDeclaration = {
    id: 'primary-string',
    volume: 'secondary-number',
    timestamp: 'secondary-number',
    content: 'regular'
  }

  it('defineTable should pass correct table schema', async () => {
    metaApi.tableExists.onCall(0).callsFake(async () => false)

    await api.defineTable('table', fieldsInputDeclaration)

    expect(metaApi.describeTable.firstCall.args[0]).to.be.equal('table')
    expect(metaApi.describeTable.firstCall.args[1]).to.be.deep.equal(fieldsOutputDeclaration)

    expect(storeApi.defineTable.firstCall.args[0]).to.be.equal('table')
    expect(storeApi.defineTable.firstCall.args[1]).to.be.deep.equal(fieldsOutputDeclaration)
  })

  it('defineTable should fail on already existing table', async () => {
    metaApi.tableExists.onCall(0).callsFake(async () => true)

    try {
      await api.defineTable('table', fieldsInputDeclaration)
      return Promise.reject('defineTable should fail on already existing table')
    } catch (err) {
      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.be.equal(messages.tableExists('table'))
    }
  })

  it('defineTable should fail on wrong table schema format', async () => {
    metaApi.tableExists.onCall(0).callsFake(async () => false)

    try {
      await api.defineTable('table', null)
      return Promise.reject('defineTable should fail on wrong table schema format')
    } catch (err) {
      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.be.equal(
        messages.invalidTableSchema('table', messages.tableDescriptorNotObject, null)
      )
    }
  })

  it('find should pass correct search expressions with all fields', async () => {
    metaApi.tableExists.onCall(0).callsFake(async () => true)
    metaApi.getTableInfo.onCall(0).callsFake(async () => fieldsOutputDeclaration)

    const resultSet = []
    storeApi.find.onCall(0).callsFake(async () => resultSet)

    const result = await api.find(
      'table',
      { volume: 100 },
      { id: 1, 'content.text': 1 },
      { timestamp: -1 },
      100,
      200
    )

    expect(storeApi.find.firstCall.args[0]).to.be.equal('table')
    expect(storeApi.find.firstCall.args[1]).to.be.deep.equal({
      volume: 100
    })
    expect(storeApi.find.firstCall.args[2]).to.be.deep.equal({
      id: 1,
      'content.text': 1
    })
    expect(storeApi.find.firstCall.args[3]).to.be.deep.equal({ timestamp: -1 })
    expect(storeApi.find.firstCall.args[4]).to.be.equal(100)
    expect(storeApi.find.firstCall.args[5]).to.be.equal(200)

    expect(result).to.be.equal(resultSet)
  })

  it('find should pass correct search expressions logical/range query operators', async () => {
    metaApi.tableExists.onCall(0).callsFake(async () => true)
    metaApi.getTableInfo.onCall(0).callsFake(async () => fieldsOutputDeclaration)

    const resultSet = []
    storeApi.find.onCall(0).callsFake(async () => resultSet)

    const findQuery = {
      $and: [
        { $or: [{ timestamp: { $lt: 100 } }, { timestamp: { $gt: 1000 } }] },
        { $not: { volume: { $eq: 100 } } }
      ]
    }

    const result = await api.find(
      'table',
      findQuery,
      { id: 1, 'content.text': 1 },
      { timestamp: -1 },
      100,
      200
    )

    expect(storeApi.find.firstCall.args[0]).to.be.equal('table')
    expect(storeApi.find.firstCall.args[1]).to.be.deep.equal(findQuery)
    expect(storeApi.find.firstCall.args[2]).to.be.deep.equal({
      id: 1,
      'content.text': 1
    })
    expect(storeApi.find.firstCall.args[3]).to.be.deep.equal({ timestamp: -1 })
    expect(storeApi.find.firstCall.args[4]).to.be.equal(100)
    expect(storeApi.find.firstCall.args[5]).to.be.equal(200)

    expect(result).to.be.equal(resultSet)
  })

  it('find should pass correct search expressions without fields projection', async () => {
    metaApi.tableExists.onCall(0).callsFake(async () => true)
    metaApi.getTableInfo.onCall(0).callsFake(async () => fieldsOutputDeclaration)

    const resultSet = []
    storeApi.find.onCall(0).callsFake(async () => resultSet)

    const result = await api.find('table', { volume: 100 }, null, { timestamp: -1 }, 100, 200)

    expect(storeApi.find.firstCall.args[0]).to.be.equal('table')
    expect(storeApi.find.firstCall.args[1]).to.be.deep.equal({
      volume: 100
    })
    expect(storeApi.find.firstCall.args[2]).to.be.deep.equal(null)
    expect(storeApi.find.firstCall.args[3]).to.be.deep.equal({ timestamp: -1 })
    expect(storeApi.find.firstCall.args[4]).to.be.equal(100)
    expect(storeApi.find.firstCall.args[5]).to.be.equal(200)

    expect(result).to.be.equal(resultSet)
  })

  it('find should pass correct search expressions without sort keys', async () => {
    metaApi.tableExists.onCall(0).callsFake(async () => true)
    metaApi.getTableInfo.onCall(0).callsFake(async () => fieldsOutputDeclaration)

    const resultSet = []
    storeApi.find.onCall(0).callsFake(async () => resultSet)

    const result = await api.find(
      'table',
      { volume: 100 },
      { id: 1, 'content.text': 1 },
      null,
      100,
      200
    )

    expect(storeApi.find.firstCall.args[0]).to.be.equal('table')
    expect(storeApi.find.firstCall.args[1]).to.be.deep.equal({
      volume: 100
    })
    expect(storeApi.find.firstCall.args[2]).to.be.deep.equal({
      id: 1,
      'content.text': 1
    })
    expect(storeApi.find.firstCall.args[3]).to.be.deep.equal(null)
    expect(storeApi.find.firstCall.args[4]).to.be.equal(100)
    expect(storeApi.find.firstCall.args[5]).to.be.equal(200)

    expect(result).to.be.equal(resultSet)
  })

  it('find should pass correct search expressions without skip and limit', async () => {
    metaApi.tableExists.onCall(0).callsFake(async () => true)
    metaApi.getTableInfo.onCall(0).callsFake(async () => fieldsOutputDeclaration)

    const resultSet = []
    storeApi.find.onCall(0).callsFake(async () => resultSet)

    const result = await api.find(
      'table',
      { volume: 100 },
      { id: 1, 'content.text': 1 },
      { timestamp: -1 }
    )

    expect(storeApi.find.firstCall.args[0]).to.be.equal('table')
    expect(storeApi.find.firstCall.args[1]).to.be.deep.equal({
      volume: 100
    })
    expect(storeApi.find.firstCall.args[2]).to.be.deep.equal({
      id: 1,
      'content.text': 1
    })
    expect(storeApi.find.firstCall.args[3]).to.be.deep.equal({ timestamp: -1 })
    expect(storeApi.find.firstCall.args[4]).to.be.equal(0)
    expect(storeApi.find.firstCall.args[5]).to.be.equal(Infinity)

    expect(result).to.be.equal(resultSet)
  })

  it('find should fail on wrong skip/limit values', async () => {
    metaApi.tableExists.onCall(0).callsFake(async () => true)
    metaApi.getTableInfo.onCall(0).callsFake(async () => fieldsOutputDeclaration)

    try {
      await api.find(
        'table',
        { volume: 100 },
        { id: 1, 'content.text': 1 },
        { timestamp: -1 },
        'skip',
        'limit'
      )
      return Promise.reject('find should fail on wrong skip/limit values')
    } catch (err) {
      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.be.equal(messages.invalidPagination('skip', 'limit'))
    }
  })

  it('find should fail on nonExisting fields on search fields key', async () => {
    metaApi.tableExists.onCall(0).callsFake(async () => true)
    metaApi.getTableInfo.onCall(0).callsFake(async () => fieldsOutputDeclaration)

    try {
      await api.find(
        'table',
        { volumeErr: 100 },
        { id: 1, 'content.text': 1 },
        { timestamp: -1 },
        100,
        200
      )
      return Promise.reject('find should fail on nonExisting fields on search fields key')
    } catch (err) {
      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.be.equal(
        messages.invalidFieldList(
          'find',
          'table',
          { volumeErr: 100 },
          messages.nonExistingField,
          'volumeErr'
        )
      )
    }
  })

  it('find should fail on nonExisting fields on projection fields key', async () => {
    metaApi.tableExists.onCall(0).callsFake(async () => true)
    metaApi.getTableInfo.onCall(0).callsFake(async () => fieldsOutputDeclaration)

    try {
      await api.find(
        'table',
        { volume: 100 },
        { idErr: 1, 'contentErr.text': 1 },
        { timestamp: -1 },
        100,
        200
      )
      return Promise.reject('find should fail on nonExisting fields on projection fields key')
    } catch (err) {
      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.be.equal(
        messages.invalidFieldList(
          'find',
          'table',
          { idErr: 1, 'contentErr.text': 1 },
          messages.illegalProjectionColumn,
          'idErr'
        )
      )
    }
  })

  it('find should fail on nonExisting fields on sort fields key', async () => {
    metaApi.tableExists.onCall(0).callsFake(async () => true)
    metaApi.getTableInfo.onCall(0).callsFake(async () => fieldsOutputDeclaration)

    try {
      await api.find(
        'table',
        { volume: 100 },
        { id: 1, 'content.text': 1 },
        { timestampErr: -1 },
        100,
        200
      )
      return Promise.reject('find should fail on nonExisting fields on sort fields key')
    } catch (err) {
      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.be.equal(
        messages.invalidFieldList(
          'find',
          'table',
          { id: 1, 'content.text': 1 },
          messages.illegalSortColumn,
          'timestampErr'
        )
      )
    }
  })

  it('find should fail on bad request', async () => {
    metaApi.tableExists.onCall(0).callsFake(async () => true)
    metaApi.getTableInfo.onCall(0).callsFake(async () => fieldsOutputDeclaration)

    try {
      await api.find('table', null)
      return Promise.reject('find should fail on bad request')
    } catch (err) {
      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.be.equal(
        messages.invalidSearchExpression('find', 'table', null, messages.searchExpressionNotObject)
      )
    }
  })

  it('findOne should pass correct search expressions with all fields', async () => {
    metaApi.tableExists.onCall(0).callsFake(async () => true)
    metaApi.getTableInfo.onCall(0).callsFake(async () => fieldsOutputDeclaration)

    const resultValue = {}
    storeApi.findOne.onCall(0).callsFake(async () => resultValue)

    const result = await api.findOne('table', { volume: 100 }, { id: 1, 'content.text': 1 })

    expect(storeApi.findOne.firstCall.args[0]).to.be.equal('table')
    expect(storeApi.findOne.firstCall.args[1]).to.be.deep.equal({
      volume: 100
    })
    expect(storeApi.findOne.firstCall.args[2]).to.be.deep.equal({
      id: 1,
      'content.text': 1
    })

    expect(result).to.be.equal(resultValue)
  })

  it('findOne should pass correct search expressions without projection key', async () => {
    metaApi.tableExists.onCall(0).callsFake(async () => true)
    metaApi.getTableInfo.onCall(0).callsFake(async () => fieldsOutputDeclaration)

    const resultValue = {}
    storeApi.findOne.onCall(0).callsFake(async () => resultValue)

    const result = await api.findOne('table', { volume: 100 }, null)

    expect(storeApi.findOne.firstCall.args[0]).to.be.equal('table')
    expect(storeApi.findOne.firstCall.args[1]).to.be.deep.equal({
      volume: 100
    })
    expect(storeApi.findOne.firstCall.args[2]).to.be.deep.equal(null)

    expect(result).to.be.equal(resultValue)
  })

  it('findOne should fail on nonExisting fields on search fields key', async () => {
    metaApi.tableExists.onCall(0).callsFake(async () => true)
    metaApi.getTableInfo.onCall(0).callsFake(async () => fieldsOutputDeclaration)

    try {
      await api.findOne('table', { volumeErr: 100 }, { id: 1, 'content.text': 1 })
      return Promise.reject('findOne should fail on nonExisting fields on search fields key')
    } catch (err) {
      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.be.equal(
        messages.invalidFieldList(
          'findOne',
          'table',
          { volumeErr: 100 },
          messages.nonExistingField,
          'volumeErr'
        )
      )
    }
  })

  it('findOne should fail on nonExisting fields on projection fields key', async () => {
    metaApi.tableExists.onCall(0).callsFake(async () => true)
    metaApi.getTableInfo.onCall(0).callsFake(async () => fieldsOutputDeclaration)

    try {
      await api.findOne('table', { volume: 100 }, { idErr: 1, 'contentErr.text': 1 })
      return Promise.reject('findOne should fail on nonExisting fields on projection fields key')
    } catch (err) {
      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.be.equal(
        messages.invalidFieldList(
          'findOne',
          'table',
          { idErr: 1, 'contentErr.text': 1 },
          messages.illegalProjectionColumn,
          'idErr'
        )
      )
    }
  })

  it('findOne should fail on bad request', async () => {
    metaApi.tableExists.onCall(0).callsFake(async () => true)
    metaApi.getTableInfo.onCall(0).callsFake(async () => fieldsOutputDeclaration)

    try {
      await api.findOne('table', null)
      return Promise.reject('findOne should fail on bad request')
    } catch (err) {
      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.be.equal(
        messages.invalidSearchExpression(
          'findOne',
          'table',
          null,
          messages.searchExpressionNotObject
        )
      )
    }
  })

  it('count should pass correct search expressions with all fields', async () => {
    metaApi.tableExists.onCall(0).callsFake(async () => true)
    metaApi.getTableInfo.onCall(0).callsFake(async () => fieldsOutputDeclaration)

    storeApi.count.onCall(0).callsFake(async () => 100)

    const result = await api.count('table', { volume: 100 })

    expect(storeApi.count.firstCall.args[0]).to.be.equal('table')
    expect(storeApi.count.firstCall.args[1]).to.be.deep.equal({
      volume: 100
    })

    expect(result).to.be.equal(100)
  })

  it('count should fail on nonExisting fields on search fields key', async () => {
    metaApi.tableExists.onCall(0).callsFake(async () => true)
    metaApi.getTableInfo.onCall(0).callsFake(async () => fieldsOutputDeclaration)

    try {
      await api.count('table', { volumeErr: 100 })
      return Promise.reject('count should fail on nonExisting fields on search fields key')
    } catch (err) {
      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.be.equal(
        messages.invalidFieldList(
          'count',
          'table',
          { volumeErr: 100 },
          messages.nonExistingField,
          'volumeErr'
        )
      )
    }
  })

  it('count should fail on bad request', async () => {
    metaApi.tableExists.onCall(0).callsFake(async () => true)
    metaApi.getTableInfo.onCall(0).callsFake(async () => fieldsOutputDeclaration)

    try {
      await api.count('table', null)
      return Promise.reject('count should fail on bad request')
    } catch (err) {
      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.be.equal(
        messages.invalidSearchExpression('count', 'table', null, messages.searchExpressionNotObject)
      )
    }
  })

  it('insert should pass correct insert expressions', async () => {
    metaApi.tableExists.onCall(0).callsFake(async () => true)
    metaApi.getTableInfo.onCall(0).callsFake(async () => fieldsOutputDeclaration)

    await api.insert('table', {
      id: '100',
      volume: 100,
      timestamp: 200,
      content: {}
    })

    expect(storeApi.insert.firstCall.args[0]).to.be.equal('table')
    expect(storeApi.insert.firstCall.args[1]).to.be.deep.equal({
      id: '100',
      volume: 100,
      timestamp: 200,
      content: {}
    })
  })

  it('insert should fail on nonExisting fields in schema', async () => {
    metaApi.tableExists.onCall(0).callsFake(async () => true)
    metaApi.getTableInfo.onCall(0).callsFake(async () => fieldsOutputDeclaration)

    try {
      await api.insert('table', {
        idErr: '100',
        volumeErr: 100,
        timestampErr: 200,
        contentErr: {}
      })
      return Promise.reject('insert should fail on nonExisting fields in schema')
    } catch (err) {
      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.be.equal(
        messages.invalidFieldList(
          'insert',
          'table',
          {
            idErr: '100',
            volumeErr: 100,
            timestampErr: 200,
            contentErr: {}
          },
          messages.nonExistingField,
          'idErr'
        )
      )
    }
  })

  it('insert should fail on bad request', async () => {
    metaApi.tableExists.onCall(0).callsFake(async () => true)
    metaApi.getTableInfo.onCall(0).callsFake(async () => fieldsOutputDeclaration)

    try {
      await api.insert('table', null)
      return Promise.reject('insert should fail on nonExisting fields in schema')
    } catch (err) {
      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.be.equal(
        messages.invalidFieldList('insert', 'table', null, messages.fieldListNotObject)
      )
    }
  })

  it('update should pass correct search & update expressions', async () => {
    metaApi.tableExists.onCall(0).callsFake(async () => true)
    metaApi.getTableInfo.onCall(0).callsFake(async () => fieldsOutputDeclaration)

    await api.update(
      'table',
      { volume: 100 },
      {
        $set: { volume: 1000, 'content.one': 20 },
        $unset: { volume: true, 'content.two': true },
        $inc: { timestamp: 3, 'content.counter': 4 }
      }
    )

    expect(storeApi.update.firstCall.args[0]).to.be.equal('table')
    expect(storeApi.update.firstCall.args[1]).to.be.deep.equal({
      volume: 100
    })
    expect(storeApi.update.firstCall.args[2]).to.be.deep.equal({
      $set: { volume: 1000, 'content.one': 20 },
      $unset: { volume: true, 'content.two': true },
      $inc: { timestamp: 3, 'content.counter': 4 }
    })
  })

  it('update should fail on nonExisting fields on search fields key', async () => {
    metaApi.tableExists.onCall(0).callsFake(async () => true)
    metaApi.getTableInfo.onCall(0).callsFake(async () => fieldsOutputDeclaration)

    try {
      await api.update(
        'table',
        { volumeErr: 100 },
        {
          $set: { volume: 'vol', 'content.one': 20 },
          $unset: { volume: true, 'content.two': true },
          $inc: { timestamp: 3, 'content.counter': 4 }
        }
      )
      return Promise.reject('update should fail on nonExisting fields on search fields key')
    } catch (err) {
      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.be.equal(
        messages.invalidFieldList(
          'update',
          'table',
          { volumeErr: 100 },
          messages.nonExistingField,
          'volumeErr'
        )
      )
    }
  })

  it('update should fail on nonExisting fields on update fields key', async () => {
    metaApi.tableExists.onCall(0).callsFake(async () => true)
    metaApi.getTableInfo.onCall(0).callsFake(async () => fieldsOutputDeclaration)

    try {
      await api.update(
        'table',
        { volume: 100 },
        {
          $set: { volumeErr: 'vol', 'contentErr.one': 20 },
          $unset: { volumeErr: true, 'contentErr.two': true },
          $inc: { timestampErr: 3, 'contentErr.counter': 4 }
        }
      )
      return Promise.reject('update should fail on nonExisting fields on search fields key')
    } catch (err) {
      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.be.equal(
        messages.invalidUpdateExpression(
          'table',
          {
            $set: { volumeErr: 'vol', 'contentErr.one': 20 },
            $unset: { volumeErr: true, 'contentErr.two': true },
            $inc: { timestampErr: 3, 'contentErr.counter': 4 }
          },
          messages.incompatibleUpdateValue,
          'volumeErr'
        )
      )
    }
  })

  it('update should fail on bad search request', async () => {
    metaApi.tableExists.onCall(0).callsFake(async () => true)
    metaApi.getTableInfo.onCall(0).callsFake(async () => fieldsOutputDeclaration)

    try {
      await api.update('table', null, {
        $set: { volume: 'vol', 'content.one': 20 },
        $unset: { volume: true, 'content.two': true },
        $inc: { timestamp: 3, 'content.counter': 4 }
      })
      return Promise.reject('update should fail on bad request')
    } catch (err) {
      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.be.equal(
        messages.invalidSearchExpression(
          'update',
          'table',
          null,
          messages.searchExpressionNotObject
        )
      )
    }
  })

  it('update should fail on bad update request', async () => {
    metaApi.tableExists.onCall(0).callsFake(async () => true)
    metaApi.getTableInfo.onCall(0).callsFake(async () => fieldsOutputDeclaration)

    try {
      await api.update('table', { volume: 100 }, null)
      return Promise.reject('update should fail on bad request')
    } catch (err) {
      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.be.equal(
        messages.invalidUpdateExpression('table', null, messages.updateExpressionNotValidObject)
      )
    }
  })

  it('delete should pass correct search & delete expressions', async () => {
    metaApi.tableExists.onCall(0).callsFake(async () => true)
    metaApi.getTableInfo.onCall(0).callsFake(async () => fieldsOutputDeclaration)

    await api.delete('table', { volume: 100 })

    expect(storeApi.del.firstCall.args[0]).to.be.equal('table')
    expect(storeApi.del.firstCall.args[1]).to.be.deep.equal({
      volume: 100
    })
  })

  it('delete should fail on nonExisting fields on search fields key', async () => {
    metaApi.tableExists.onCall(0).callsFake(async () => true)
    metaApi.getTableInfo.onCall(0).callsFake(async () => fieldsOutputDeclaration)

    try {
      await api.delete('table', { volumeErr: 100 })
      return Promise.reject('delete should fail on nonExisting fields on search fields key')
    } catch (err) {
      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.be.equal(
        messages.invalidFieldList(
          'delete',
          'table',
          { volumeErr: 100 },
          messages.nonExistingField,
          'volumeErr'
        )
      )
    }
  })

  it('delete should fail on bad search request', async () => {
    metaApi.tableExists.onCall(0).callsFake(async () => true)
    metaApi.getTableInfo.onCall(0).callsFake(async () => fieldsOutputDeclaration)

    try {
      await api.delete('table', null)
      return Promise.reject('delete should fail on bad request')
    } catch (err) {
      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.be.equal(
        messages.invalidSearchExpression(
          'delete',
          'table',
          null,
          messages.searchExpressionNotObject
        )
      )
    }
  })
})
