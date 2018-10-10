import sinon from 'sinon'

test('resolve-storage-lite index', () => {
  const createAdapter = require('resolve-storage-base')
  const init = require('../src/init')
  const loadEvents = require('../src/load-events')
  const saveEvent = require('../src/save-event')
  const dispose = require('../src/dispose')

  sinon.stub(init, 'default').callsFake(() => () => {})
  sinon.stub(loadEvents, 'default').callsFake(() => () => {})
  sinon.stub(saveEvent, 'default').callsFake(() => () => {})
  sinon.stub(dispose, 'default').callsFake(() => () => {})

  sinon.stub(createAdapter, 'default').callsFake((...args) => {
    for (const func of args) {
      if (typeof func === 'function') {
        func()
      }
    }
  })

  const index = require('../src/index.js')

  expect(init.default.callCount).toEqual(0)
  expect(loadEvents.default.callCount).toEqual(0)
  expect(saveEvent.default.callCount).toEqual(0)
  expect(dispose.default.callCount).toEqual(0)

  index.default()

  expect(init.default.callCount).toEqual(1)
  expect(loadEvents.default.callCount).toEqual(1)
  expect(saveEvent.default.callCount).toEqual(1)
  expect(dispose.default.callCount).toEqual(1)

  const adapterCallArgs = createAdapter.default.firstCall.args
  expect(adapterCallArgs[0]).toEqual(init.default)
  expect(adapterCallArgs[1]).toEqual(loadEvents.default)
  expect(adapterCallArgs[2]).toEqual(saveEvent.default)
  expect(adapterCallArgs[3]).toEqual(dispose.default)
})
