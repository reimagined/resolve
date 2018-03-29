import NeDB from 'nedb'
import sinon from 'sinon'
import { expect } from 'chai'

import storage from '../src/storage'

describe('storage', () => {
  let sandbox

  beforeEach(() => {
    sandbox = sinon.sandbox.create()

    sandbox.stub(storage, 'prepare').returns(Promise.resolve())
    sandbox.stub(storage, 'saveEvent')
    sandbox.stub(storage, 'loadEvents')
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('init should load events from database', async () => {
    const error = null
    const db = {
      loadDatabase: sinon.spy(callback => callback(error))
    }

    await storage.init(db)

    sinon.assert.calledWith(db.loadDatabase)
  })

  it('init should throw error', async () => {
    const error = 'Error'
    const db = {
      loadDatabase: sinon.spy(callback => callback(error))
    }

    try {
      await storage.init(db)
    } catch (err) {
      expect(err).to.equal(error)
      return
    }

    throw new Error()
  })

  it('createIndex should load events from database', async () => {
    const error = null
    const fieldName = 'fieldName'
    const db = {
      ensureIndex: sinon.spy((_, callback) => callback(error))
    }

    await storage.createIndex(db, fieldName)

    sinon.assert.calledWith(db.ensureIndex, { fieldName })
  })

  it('createIndex should throw error', async () => {
    const error = 'Error'
    const fieldName = 'fieldName'
    const db = {
      ensureIndex: sinon.spy((_, callback) => callback(error))
    }

    try {
      await storage.createIndex(db, fieldName)
    } catch (err) {
      expect(err).to.equal(error)
      return
    }

    throw new Error()
  })

  it('createDatabase should create a database', () => {
    const DB = sinon.spy()
    const filename = 'filename'

    storage.createDatabase(DB, filename)

    sinon.assert.calledWith(DB, { filename })
  })

  it('prepare should init storage and create indexes "type", "aggregateId"', async () => {
    const filename = 'filename'
    const db = {
      /* ... */
    }

    sandbox.restore()
    sandbox = sinon.sandbox.create()
    sandbox.stub(storage, 'init').returns(Promise.resolve())
    sandbox.stub(storage, 'createIndex').returns(Promise.resolve())
    sandbox.stub(storage, 'createDatabase').returns(db)

    const result = await storage.prepare(filename)

    sinon.assert.calledWith(storage.createDatabase, NeDB, filename)
    sinon.assert.calledWith(storage.init, db)
    sinon.assert.calledWith(storage.createIndex, db, 'type')
    sinon.assert.calledWith(storage.createIndex, db, 'type')

    expect(result).to.equal(db)
  })
})
