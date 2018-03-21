import { MongoClient } from 'mongodb'
import chai from 'chai'
import uuid from 'uuid'
import Promise from 'bluebird'
import createAdapter from '../src/index'

const expect = chai.expect

describe('Mongo native tests', function() {
  const config = {
    url:
      `mongodb://${process.env['TEST_MONGO_DB_HOST'] || 'localhost'}:` +
      `${process.env['TEST_MONGO_DB_PORT'] || 27017}` +
      `/resolve-storage-mongo-tests?w=1`,
    collection: 'events',
    reconnectInterval: 1000
  }

  const dropCollection = () =>
    MongoClient.connect(config.url).then(db =>
      db
        .collection(config.collection)
        .drop()
        .then(() => db.close())
    )

  let adapter = null

  beforeEach(() => {
    adapter = createAdapter(config)
  })

  afterEach(() =>
    adapter
      .dispose()
      .then(() => (adapter = null))
      .then(() => dropCollection())
  )

  describe('preserve event streaming order', () => {
    const pushEvents = () => {
      const aggregateId = uuid()
      const events = [
        { type: 'EVENT', aggregateId, aggregateVersion: 0, timestamp: 0 },
        { type: 'EVENT', aggregateId, aggregateVersion: 1, timestamp: 1 }
      ]
      return Promise.map(events, event => adapter.saveEvent(event)).then(
        () => aggregateId
      )
    }

    it('by aggregate ids', () => {
      let firstEventHandled = false

      return pushEvents()
        .then(aggregateId =>
          adapter.loadEventsByAggregateIds([aggregateId], event =>
            Promise.delay(100).then(() => {
              if (event.timestamp > 0) expect(firstEventHandled).to.be.true
              else firstEventHandled = true
            })
          )
        )
        .then(() => expect(firstEventHandled).to.be.true)
    })

    it('by event types', () => {
      let firstEventHandled = false
      return pushEvents().then(() =>
        adapter.loadEventsByTypes(['EVENT'], event =>
          Promise.delay(100).then(() => {
            if (event.timestamp > 0) expect(firstEventHandled).to.be.true
            else firstEventHandled = true
          })
        )
      )
    })
  })
})
