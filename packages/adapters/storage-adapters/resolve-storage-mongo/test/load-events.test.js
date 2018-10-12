import sinon from 'sinon'

import loadEvents from '../src/load-events'

test('load events should scan eventstore within criteria', async () => {
  const events = [{ type: 'event_type_1' }, { type: 'event_type_2' }]
  const callback = sinon.stub().callsFake(async () => await Promise.resolve())

  const cursorStream = {
    next: sinon
      .stub()
      .onFirstCall()
      .callsFake(async () => events[0])
      .onSecondCall()
      .callsFake(async () => events[1])
      .onThirdCall()
      .callsFake(async () => null),
    close: sinon.stub().callsFake(async () => null)
  }

  const cursor = {
    sort: sinon.stub().callsFake(() => cursor),
    project: sinon.stub().callsFake(() => cursor),
    stream: sinon.stub().callsFake(() => cursorStream)
  }
  const find = sinon.stub().callsFake(() => cursor)

  const pool = {
    collection: { find }
  }

  await loadEvents(
    pool,
    {
      eventTypes: ['EVENT_TYPE'],
      aggregateIds: ['AGGREGATE_ID'],
      startTime: 100,
      finishTime: 200
    },
    callback
  )

  expect(find.callCount).toEqual(1)
  expect(find.firstCall.args).toEqual([
    {
      type: { $in: ['EVENT_TYPE'] },
      aggregateId: { $in: ['AGGREGATE_ID'] },
      timestamp: {
        $gt: 100,
        $lt: 200
      }
    }
  ])

  expect(cursor.sort.callCount).toEqual(1)
  expect(cursor.sort.firstCall.args).toEqual([
    {
      timestamp: 1,
      aggregateVersion: 1
    }
  ])

  expect(cursor.project.callCount).toEqual(1)
  expect(cursor.project.firstCall.args).toEqual([{ _id: 0 }])

  expect(cursor.stream.callCount).toEqual(1)

  expect(callback.callCount).toEqual(2)
  expect(callback.firstCall.args).toEqual([events[0]])
  expect(callback.secondCall.args).toEqual([events[1]])

  expect(cursorStream.next.callCount).toEqual(3)
  expect(cursorStream.close.callCount).toEqual(1)
})
