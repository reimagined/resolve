import sinon from 'sinon'

test('resolve-storage-base index', () => {
  const createAdapter = require('../src/create-adapter')
  const wrapInit = require('../src/prepare')
  const wrapMethod = require('../src/wrap-method')
  const wrapEventFilter = require('../src/wrap-event-filter')
  const wrapDispose = require('../src/wrap-dispose')

  sinon.stub(wrapInit, 'default').callsFake(() => () => {})
  sinon.stub(wrapMethod, 'default').callsFake(() => () => {})
  sinon.stub(wrapEventFilter, 'default').callsFake(() => () => {})
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
  expect(wrapEventFilter.default.callCount).toEqual(0)
  expect(wrapDispose.default.callCount).toEqual(0)

  index.default()

  expect(wrapInit.default.callCount).toEqual(1)
  expect(wrapMethod.default.callCount).toEqual(1)
  expect(wrapEventFilter.default.callCount).toEqual(1)
  expect(wrapDispose.default.callCount).toEqual(1)

  const adapterCallArgs = createAdapter.default.firstCall.args
  expect(adapterCallArgs[0]).toEqual(wrapInit.default)
  expect(adapterCallArgs[1]).toEqual(wrapMethod.default)
  expect(adapterCallArgs[2]).toEqual(wrapEventFilter.default)
  expect(adapterCallArgs[3]).toEqual(wrapDispose.default)
})
