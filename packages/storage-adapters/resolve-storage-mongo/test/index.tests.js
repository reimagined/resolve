import sinon from 'sinon'
import { expect } from 'chai'
import { MongoClient, _setFindResult, _setInsertCommandReject } from 'mongodb'
import createAdapter from '../src'

const adapterSettings = {
  url: 'test-url',
  collection: 'test-collection',
  dbName: 'test-db'
}

const testEvent = {
  id: '1',
  type: 'event-type'
}

describe('es-mongo', () => {
  afterEach(() => {
    _setFindResult(null)
    _setInsertCommandReject(false)
  })

  it('should save event', () => {
    const adapter = createAdapter(adapterSettings)

    return adapter
      .saveEvent(testEvent)
      .then(() => {
        expect(MongoClient.connect.lastCall.args).to.deep.equal(['test-url'])
        return MongoClient.connect.lastCall.returnValue
      })
      .then(client => {
        const db = client.db(adapterSettings.dbName)
        expect(db.collection.lastCall.args).to.deep.equal(['test-collection'])
        expect(
          db.collection.lastCall.returnValue.insert.lastCall.args
        ).to.deep.equal([testEvent])

        expect(
          db.collection.lastCall.returnValue.createIndex.firstCall.args
        ).to.be.deep.equal(['timestamp'])

        expect(
          db.collection.lastCall.returnValue.createIndex.secondCall.args
        ).to.be.deep.equal(['aggregateId'])

        expect(
          db.collection.lastCall.returnValue.createIndex.thirdCall.args
        ).to.be.deep.equal([
          { aggregateId: 1, aggregateVersion: 1 },
          { unique: true }
        ])
      })
  })

  it('should load events by types', () => {
    const adapter = createAdapter(adapterSettings)
    const types = ['event-type-1', 'event-type-2']
    const eventsByTypes = [
      { id: '1', type: 'event-type-1' },
      { id: '1', type: 'event-type-2' }
    ]
    const processEvent = sinon.spy()
    _setFindResult(eventsByTypes)

    return adapter
      .loadEventsByTypes(types, processEvent)
      .then(() => MongoClient.connect.lastCall.returnValue)
      .then(client => {
        const db = client.db(adapterSettings.dbName)
        expect(db.collection.lastCall.args).to.deep.equal(['test-collection'])
        expect(
          db.collection.lastCall.returnValue.find.lastCall.args
        ).to.deep.equal([
          { type: { $in: types }, timestamp: { $gt: 0 } },
          { sort: 'timestamp' }
        ])

        expect(processEvent.args).to.deep.equal([
          [eventsByTypes[0]],
          [eventsByTypes[1]]
        ])
      })
  })

  it('should load events by aggregate ids', () => {
    const adapter = createAdapter(adapterSettings)
    const aggregateId = 'test-aggregate-id'
    const eventsByAggregateId = [
      { id: '1', aggregateId },
      { id: '1', aggregateId }
    ]

    const processEvent = sinon.spy()
    _setFindResult(eventsByAggregateId)

    return adapter
      .loadEventsByAggregateIds([aggregateId], processEvent)
      .then(() => MongoClient.connect.lastCall.returnValue)
      .then(client => {
        const db = client.db(adapterSettings.dbName)
        expect(db.collection.lastCall.args).to.deep.equal(['test-collection'])
        expect(
          db.collection.lastCall.returnValue.find.lastCall.args
        ).to.deep.equal([
          { aggregateId: { $in: [aggregateId] }, timestamp: { $gt: 0 } },
          { sort: 'timestamp' }
        ])

        expect(processEvent.args).to.deep.equal([
          [eventsByAggregateId[0]],
          [eventsByAggregateId[1]]
        ])
      })
  })
})
