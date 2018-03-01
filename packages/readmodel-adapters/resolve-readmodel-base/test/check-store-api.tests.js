import { expect } from 'chai'
import sinon from 'sinon'

import checkStoreApi from '../src/check-store-api'
import messages from '../src/messages'

describe('resolve-readmodel-base check-store-api', () => {
  let storeApi, metaApi, api

  beforeEach(() => {
    storeApi = {
      defineStorage: sinon.stub(),
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
      storageExists: sinon.stub(),
      getStorageInfo: sinon.stub(),
      describeStorage: sinon.stub(),
      getStorageNames: sinon.stub(),
      drop: sinon.stub()
    }

    api = checkStoreApi({ metaApi, storeApi })
  })

  afterEach(() => {
    storeApi = null
    metaApi = null
    api = null
  })

  it('defineStorage should pass correct storage schema', async () => {
    metaApi.storageExists.onCall(0).callsFake(async () => false)

    await api.defineStorage('table', [
      { name: 'id', type: 'number', index: 'primary' },
      { name: 'vol', type: 'string', index: 'secondary' },
      { name: 'sec', type: 'string', index: 'secondary' },
      { name: 'content', type: 'json' }
    ])

    expect(metaApi.describeStorage.firstCall.args[0]).to.be.equal('table')
    expect(metaApi.describeStorage.firstCall.args[1]).to.be.deep.equal({
      fieldTypes: { id: 'number', vol: 'string', sec: 'string', content: 'json' },
      primaryIndex: { name: 'id', type: 'number' },
      secondaryIndexes: [{ name: 'vol', type: 'string' }, { name: 'sec', type: 'string' }]
    })

    expect(storeApi.defineStorage.firstCall.args[0]).to.be.equal('table')
    expect(storeApi.defineStorage.firstCall.args[1]).to.be.deep.equal({
      fieldTypes: { id: 'number', vol: 'string', sec: 'string', content: 'json' },
      primaryIndex: { name: 'id', type: 'number' },
      secondaryIndexes: [{ name: 'vol', type: 'string' }, { name: 'sec', type: 'string' }]
    })
  })

  it('defineStorage should fail on already existing storage', async () => {
    metaApi.storageExists.onCall(0).callsFake(async () => true)

    try {
      await api.defineStorage('table', [
        { name: 'id', type: 'number', index: 'primary' },
        { name: 'vol', type: 'string', index: 'secondary' },
        { name: 'sec', type: 'string', index: 'secondary' },
        { name: 'content', type: 'json' }
      ])
      return Promise.reject('defineStorage should fail on already existing storage')
    } catch (err) {
      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.be.equal(messages.storageExists('table'))
    }
  })

  it('defineStorage should fail on wrong storage schema format', async () => {
    metaApi.storageExists.onCall(0).callsFake(async () => false)

    try {
      await api.defineStorage('table', null)
      return Promise.reject('defineStorage should fail on wrong storage schema format')
    } catch (err) {
      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.be.equal(messages.invalidStorageSchema)
    }
  })

  it('find should pass correct search expressions with all fields', async () => {
    metaApi.storageExists.onCall(0).callsFake(async () => true)
    metaApi.getStorageInfo.onCall(0).callsFake(async () => ({
      fieldTypes: { id: 'number', volume: 'string', timestamp: 'number', content: 'json' },
      primaryIndex: { name: 'id', type: 'number' },
      secondaryIndexes: [{ name: 'volume', type: 'string' }, { name: 'timestamp', type: 'number' }]
    }))

    const resultSet = []
    storeApi.find.onCall(0).callsFake(async () => resultSet)

    const result = await api.find(
      'table',
      { volume: 'volume' },
      { id: 1, 'content.text': 1 },
      { timestamp: -1 },
      100,
      200
    )

    expect(storeApi.find.firstCall.args[0]).to.be.equal('table')
    expect(storeApi.find.firstCall.args[1]).to.be.deep.equal({ volume: 'volume' })
    expect(storeApi.find.firstCall.args[2]).to.be.deep.equal({ id: 1, 'content.text': 1 })
    expect(storeApi.find.firstCall.args[3]).to.be.deep.equal({ timestamp: -1 })
    expect(storeApi.find.firstCall.args[4]).to.be.equal(100)
    expect(storeApi.find.firstCall.args[5]).to.be.equal(200)

    expect(result).to.be.equal(resultSet)
  })

  it('find should pass correct search expressions without fields projection', async () => {
    metaApi.storageExists.onCall(0).callsFake(async () => true)
    metaApi.getStorageInfo.onCall(0).callsFake(async () => ({
      fieldTypes: { id: 'number', volume: 'string', timestamp: 'number', content: 'json' },
      primaryIndex: { name: 'id', type: 'number' },
      secondaryIndexes: [{ name: 'volume', type: 'string' }, { name: 'timestamp', type: 'number' }]
    }))

    const resultSet = []
    storeApi.find.onCall(0).callsFake(async () => resultSet)

    const result = await api.find('table', { volume: 'volume' }, null, { timestamp: -1 }, 100, 200)

    expect(storeApi.find.firstCall.args[0]).to.be.equal('table')
    expect(storeApi.find.firstCall.args[1]).to.be.deep.equal({ volume: 'volume' })
    expect(storeApi.find.firstCall.args[2]).to.be.deep.equal(null)
    expect(storeApi.find.firstCall.args[3]).to.be.deep.equal({ timestamp: -1 })
    expect(storeApi.find.firstCall.args[4]).to.be.equal(100)
    expect(storeApi.find.firstCall.args[5]).to.be.equal(200)

    expect(result).to.be.equal(resultSet)
  })

  it('find should pass correct search expressions without sort keys', async () => {
    metaApi.storageExists.onCall(0).callsFake(async () => true)
    metaApi.getStorageInfo.onCall(0).callsFake(async () => ({
      fieldTypes: { id: 'number', volume: 'string', timestamp: 'number', content: 'json' },
      primaryIndex: { name: 'id', type: 'number' },
      secondaryIndexes: [{ name: 'volume', type: 'string' }, { name: 'timestamp', type: 'number' }]
    }))

    const resultSet = []
    storeApi.find.onCall(0).callsFake(async () => resultSet)

    const result = await api.find(
      'table',
      { volume: 'volume' },
      { id: 1, 'content.text': 1 },
      null,
      100,
      200
    )

    expect(storeApi.find.firstCall.args[0]).to.be.equal('table')
    expect(storeApi.find.firstCall.args[1]).to.be.deep.equal({ volume: 'volume' })
    expect(storeApi.find.firstCall.args[2]).to.be.deep.equal({ id: 1, 'content.text': 1 })
    expect(storeApi.find.firstCall.args[3]).to.be.deep.equal(null)
    expect(storeApi.find.firstCall.args[4]).to.be.equal(100)
    expect(storeApi.find.firstCall.args[5]).to.be.equal(200)

    expect(result).to.be.equal(resultSet)
  })

  it('find should pass correct search expressions without skip and limit', async () => {
    metaApi.storageExists.onCall(0).callsFake(async () => true)
    metaApi.getStorageInfo.onCall(0).callsFake(async () => ({
      fieldTypes: { id: 'number', volume: 'string', timestamp: 'number', content: 'json' },
      primaryIndex: { name: 'id', type: 'number' },
      secondaryIndexes: [{ name: 'volume', type: 'string' }, { name: 'timestamp', type: 'number' }]
    }))

    const resultSet = []
    storeApi.find.onCall(0).callsFake(async () => resultSet)

    const result = await api.find(
      'table',
      { volume: 'volume' },
      { id: 1, 'content.text': 1 },
      { timestamp: -1 }
    )

    expect(storeApi.find.firstCall.args[0]).to.be.equal('table')
    expect(storeApi.find.firstCall.args[1]).to.be.deep.equal({ volume: 'volume' })
    expect(storeApi.find.firstCall.args[2]).to.be.deep.equal({ id: 1, 'content.text': 1 })
    expect(storeApi.find.firstCall.args[3]).to.be.deep.equal({ timestamp: -1 })
    expect(storeApi.find.firstCall.args[4]).to.be.equal(0)
    expect(storeApi.find.firstCall.args[5]).to.be.equal(Infinity)

    expect(result).to.be.equal(resultSet)
  })

  it('find should fail on unexisting fields on search fields key', async () => {
    metaApi.storageExists.onCall(0).callsFake(async () => true)
    metaApi.getStorageInfo.onCall(0).callsFake(async () => ({
      fieldTypes: { id: 'number', volume: 'string', timestamp: 'number', content: 'json' },
      primaryIndex: { name: 'id', type: 'number' },
      secondaryIndexes: [{ name: 'volume', type: 'string' }, { name: 'timestamp', type: 'number' }]
    }))

    try {
      await api.find(
        'table',
        { volumeErr: 'volume' },
        { id: 1, 'content.text': 1 },
        { timestamp: -1 },
        100,
        200
      )
      return Promise.reject('find should fail on unexisting fields on search fields key')
    } catch (err) {
      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.be.equal(messages.invalidProjectionKey('volumeErr'))
    }
  })

  it('find should fail on unexisting fields on projection fields key', async () => {
    metaApi.storageExists.onCall(0).callsFake(async () => true)
    metaApi.getStorageInfo.onCall(0).callsFake(async () => ({
      fieldTypes: { id: 'number', volume: 'string', timestamp: 'number', content: 'json' },
      primaryIndex: { name: 'id', type: 'number' },
      secondaryIndexes: [{ name: 'volume', type: 'string' }, { name: 'timestamp', type: 'number' }]
    }))

    try {
      await api.find(
        'table',
        { volume: 'volume' },
        { idErr: 1, 'contentErr.text': 1 },
        { timestamp: -1 },
        100,
        200
      )
      return Promise.reject('find should fail on unexisting fields on projection fields key')
    } catch (err) {
      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.be.equal(messages.invalidProjectionKey('idErr'))
    }
  })

  it('find should fail on unexisting fields on sort fields key', async () => {
    metaApi.storageExists.onCall(0).callsFake(async () => true)
    metaApi.getStorageInfo.onCall(0).callsFake(async () => ({
      fieldTypes: { id: 'number', volume: 'string', timestamp: 'number', content: 'json' },
      primaryIndex: { name: 'id', type: 'number' },
      secondaryIndexes: [{ name: 'volume', type: 'string' }, { name: 'timestamp', type: 'number' }]
    }))

    try {
      await api.find(
        'table',
        { volume: 'volume' },
        { id: 1, 'content.text': 1 },
        { timestampErr: -1 },
        100,
        200
      )
      return Promise.reject('find should fail on unexisting fields on sort fields key')
    } catch (err) {
      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.be.equal(messages.invalidProjectionKey('timestampErr'))
    }
  })

  it('find should fail on bad request', async () => {
    metaApi.storageExists.onCall(0).callsFake(async () => true)
    metaApi.getStorageInfo.onCall(0).callsFake(async () => ({
      fieldTypes: { id: 'number', volume: 'string', timestamp: 'number', content: 'json' },
      primaryIndex: { name: 'id', type: 'number' },
      secondaryIndexes: [{ name: 'volume', type: 'string' }, { name: 'timestamp', type: 'number' }]
    }))

    try {
      await api.find('table', null)
      return Promise.reject('find should fail on bad request')
    } catch (err) {
      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.be.equal(messages.invalidDocumentShape(null))
    }
  })

  it('findOne should pass correct search expressions with all fields', async () => {
    metaApi.storageExists.onCall(0).callsFake(async () => true)
    metaApi.getStorageInfo.onCall(0).callsFake(async () => ({
      fieldTypes: { id: 'number', volume: 'string', timestamp: 'number', content: 'json' },
      primaryIndex: { name: 'id', type: 'number' },
      secondaryIndexes: [{ name: 'volume', type: 'string' }, { name: 'timestamp', type: 'number' }]
    }))

    const resultValue = {}
    storeApi.findOne.onCall(0).callsFake(async () => resultValue)

    const result = await api.findOne('table', { volume: 'volume' }, { id: 1, 'content.text': 1 })

    expect(storeApi.findOne.firstCall.args[0]).to.be.equal('table')
    expect(storeApi.findOne.firstCall.args[1]).to.be.deep.equal({ volume: 'volume' })
    expect(storeApi.findOne.firstCall.args[2]).to.be.deep.equal({ id: 1, 'content.text': 1 })

    expect(result).to.be.equal(resultValue)
  })

  it('findOne should pass correct search expressions without projection key', async () => {
    metaApi.storageExists.onCall(0).callsFake(async () => true)
    metaApi.getStorageInfo.onCall(0).callsFake(async () => ({
      fieldTypes: { id: 'number', volume: 'string', timestamp: 'number', content: 'json' },
      primaryIndex: { name: 'id', type: 'number' },
      secondaryIndexes: [{ name: 'volume', type: 'string' }, { name: 'timestamp', type: 'number' }]
    }))

    const resultValue = {}
    storeApi.findOne.onCall(0).callsFake(async () => resultValue)

    const result = await api.findOne('table', { volume: 'volume' }, null)

    expect(storeApi.findOne.firstCall.args[0]).to.be.equal('table')
    expect(storeApi.findOne.firstCall.args[1]).to.be.deep.equal({ volume: 'volume' })
    expect(storeApi.findOne.firstCall.args[2]).to.be.deep.equal(null)

    expect(result).to.be.equal(resultValue)
  })

  it('findOne should fail on unexisting fields on search fields key', async () => {
    metaApi.storageExists.onCall(0).callsFake(async () => true)
    metaApi.getStorageInfo.onCall(0).callsFake(async () => ({
      fieldTypes: { id: 'number', volume: 'string', timestamp: 'number', content: 'json' },
      primaryIndex: { name: 'id', type: 'number' },
      secondaryIndexes: [{ name: 'volume', type: 'string' }, { name: 'timestamp', type: 'number' }]
    }))

    try {
      await api.findOne('table', { volumeErr: 'volume' }, { id: 1, 'content.text': 1 })
      return Promise.reject('findOne should fail on unexisting fields on search fields key')
    } catch (err) {
      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.be.equal(messages.invalidProjectionKey('volumeErr'))
    }
  })

  it('findOne should fail on unexisting fields on projection fields key', async () => {
    metaApi.storageExists.onCall(0).callsFake(async () => true)
    metaApi.getStorageInfo.onCall(0).callsFake(async () => ({
      fieldTypes: { id: 'number', volume: 'string', timestamp: 'number', content: 'json' },
      primaryIndex: { name: 'id', type: 'number' },
      secondaryIndexes: [{ name: 'volume', type: 'string' }, { name: 'timestamp', type: 'number' }]
    }))

    try {
      await api.findOne('table', { volume: 'volume' }, { idErr: 1, 'contentErr.text': 1 })
      return Promise.reject('findOne should fail on unexisting fields on projection fields key')
    } catch (err) {
      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.be.equal(messages.invalidProjectionKey('idErr'))
    }
  })

  it('findOne should fail on bad request', async () => {
    metaApi.storageExists.onCall(0).callsFake(async () => true)
    metaApi.getStorageInfo.onCall(0).callsFake(async () => ({
      fieldTypes: { id: 'number', volume: 'string', timestamp: 'number', content: 'json' },
      primaryIndex: { name: 'id', type: 'number' },
      secondaryIndexes: [{ name: 'volume', type: 'string' }, { name: 'timestamp', type: 'number' }]
    }))

    try {
      await api.findOne('table', null)
      return Promise.reject('findOne should fail on bad request')
    } catch (err) {
      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.be.equal(messages.invalidDocumentShape(null))
    }
  })

  it('count should pass correct search expressions with all fields', async () => {
    metaApi.storageExists.onCall(0).callsFake(async () => true)
    metaApi.getStorageInfo.onCall(0).callsFake(async () => ({
      fieldTypes: { id: 'number', volume: 'string', timestamp: 'number', content: 'json' },
      primaryIndex: { name: 'id', type: 'number' },
      secondaryIndexes: [{ name: 'volume', type: 'string' }, { name: 'timestamp', type: 'number' }]
    }))

    storeApi.count.onCall(0).callsFake(async () => 100)

    const result = await api.count('table', { volume: 'volume' })

    expect(storeApi.count.firstCall.args[0]).to.be.equal('table')
    expect(storeApi.count.firstCall.args[1]).to.be.deep.equal({ volume: 'volume' })

    expect(result).to.be.equal(100)
  })

  it('count should fail on unexisting fields on search fields key', async () => {
    metaApi.storageExists.onCall(0).callsFake(async () => true)
    metaApi.getStorageInfo.onCall(0).callsFake(async () => ({
      fieldTypes: { id: 'number', volume: 'string', timestamp: 'number', content: 'json' },
      primaryIndex: { name: 'id', type: 'number' },
      secondaryIndexes: [{ name: 'volume', type: 'string' }, { name: 'timestamp', type: 'number' }]
    }))

    try {
      await api.count('table', { volumeErr: 'volume' })
      return Promise.reject('count should fail on unexisting fields on search fields key')
    } catch (err) {
      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.be.equal(messages.invalidProjectionKey('volumeErr'))
    }
  })

  it('count should fail on bad request', async () => {
    metaApi.storageExists.onCall(0).callsFake(async () => true)
    metaApi.getStorageInfo.onCall(0).callsFake(async () => ({
      fieldTypes: { id: 'number', volume: 'string', timestamp: 'number', content: 'json' },
      primaryIndex: { name: 'id', type: 'number' },
      secondaryIndexes: [{ name: 'volume', type: 'string' }, { name: 'timestamp', type: 'number' }]
    }))

    try {
      await api.count('table', null)
      return Promise.reject('count should fail on bad request')
    } catch (err) {
      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.be.equal(messages.invalidDocumentShape(null))
    }
  })
})
