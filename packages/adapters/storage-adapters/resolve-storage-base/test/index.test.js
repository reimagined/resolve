import sinon from 'sinon'

test('resolve-storage-base index', () => {
  const createAdapter = require('../src/create-adapter')
  const wrapInit = require('../src/prepare')
  const wrapMethod = require('../src/wrap-method')
  const wrapLoadEvents = require('../src/wrap-load-events')
  const wrapDispose = require('../src/wrap-dispose')

  sinon.stub(wrapInit, 'default').callsFake(() => () => {})
  sinon.stub(wrapMethod, 'default').callsFake(() => () => {})
  sinon.stub(wrapLoadEvents, 'default').callsFake(() => () => {})
  sinon.stub(wrapDispose, 'default').callsFake(() => () => {})

  sinon.stub(createAdapter, 'default').callsFake((...args) => {
    for (const func of args) {
      if (typeof func === 'function') {
        func()
      }
    }
  })

  const index = require('../src/index.js')

  expect(wrapInit.default.callCount).toEqual(0)
  expect(wrapMethod.default.callCount).toEqual(0)
  expect(wrapLoadEvents.default.callCount).toEqual(0)
  expect(wrapDispose.default.callCount).toEqual(0)

  index.default()

  expect(wrapInit.default.callCount).toEqual(1)
  expect(wrapMethod.default.callCount).toEqual(1)
  expect(wrapLoadEvents.default.callCount).toEqual(1)
  expect(wrapDispose.default.callCount).toEqual(1)

  const adapterCallArgs = createAdapter.default.firstCall.args
  expect(adapterCallArgs[0]).toEqual(wrapInit.default)
  expect(adapterCallArgs[1]).toEqual(wrapMethod.default)
  expect(adapterCallArgs[2]).toEqual(wrapLoadEvents.default)
  expect(adapterCallArgs[3]).toEqual(wrapDispose.default)
})
