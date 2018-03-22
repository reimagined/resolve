import sinon from 'sinon'
import { expect } from 'chai'
import { ConcurrentError } from 'resolve-storage-base'

import adapter from '../src/index'
import storage from '../src/storage'

describe('adapter', () => {
  let sandbox

  const pathToFile = 'some-path'

  beforeEach(() => {
    sandbox = sinon.sandbox.create()

    sandbox.stub(storage, 'prepare').returns(Promise.resolve())
    sandbox.stub(storage, 'saveEvent')
    sandbox.stub(storage, 'loadEvents')
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('saveEvent should save event to storage', async () => {
    const event = { type: 'SOME_EVENT' }

    await adapter({ pathToFile }).saveEvent(event)

    sinon.assert.calledWith(storage.prepare, pathToFile)
    sinon.assert.calledWith(storage.saveEvent, event)
  })

  it('loadEventsByTypes should load events by types from storage', async () => {
    const types = ['SOME_EVENT_ONE', 'SOME_EVENT_TWO']
    const callback = sinon.spy()

    await adapter({ pathToFile }).loadEventsByTypes(types, callback)

    sinon.assert.calledWith(storage.prepare, pathToFile)
    sinon.assert.calledWith(
      storage.loadEvents,
      { type: { $in: types } },
      0,
      callback
    )
  })

  it('loadEventsByAggregateIds should load events by aggregateId from storage', async () => {
    const ids = ['id1', 'id2', 'id3']
    const callback = sinon.spy()

    await adapter({ pathToFile }).loadEventsByAggregateIds(ids, callback)

    sinon.assert.calledWith(storage.prepare, pathToFile)
    sinon.assert.calledWith(
      storage.loadEvents,
      { aggregateId: { $in: ids } },
      0,
      callback
    )
  })

  it('throw an exception if the event with the current version exists', async () => {
    sandbox.restore()
    const storage = await adapter()

    try {
      await storage.saveEvent({ aggregateId: 1, aggregateVersion: 1 })
      await storage.saveEvent({ aggregateId: 1, aggregateVersion: 1 })
    } catch (e) {
      expect(e).to.be.an.instanceof(ConcurrentError)
    }
  })
})
