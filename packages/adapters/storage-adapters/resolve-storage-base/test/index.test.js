import sinon from 'sinon'

test('resolve-storage-base index', () => {
  const createAdapter = require('../src/create-adapter')
  const wrapInit = require('../src/prepare')
  const wrapMethod = require('../src/wrap-method')
  const wrapEventFilter = require('../src/wrap-event-filter')
  const wrapDispose = require('../src/wrap-dispose')
  const validateEventFilter = require('../src/validate-event-filter')
  const importStream = require('../src/import')
  const exportStream = require('../src/export')

  sinon.stub(wrapInit, 'default').callsFake(() => () => {})
  sinon.stub(wrapMethod, 'default').callsFake(() => () => {})
  sinon.stub(wrapEventFilter, 'default').callsFake(() => () => {})
  sinon.stub(wrapDispose, 'default').callsFake(() => () => {})
  sinon.stub(validateEventFilter, 'default').callsFake(() => () => {})
  sinon.stub(importStream, 'default').callsFake(() => () => {})
  sinon.stub(exportStream, 'default').callsFake(() => () => {})

  sinon.stub(createAdapter, 'default').callsFake(args => {
    for (const func of Object.values(args)) {
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
  expect(validateEventFilter.default.callCount).toEqual(0)
  expect(importStream.default.callCount).toEqual(0)
  expect(exportStream.default.callCount).toEqual(0)

  index.default()

  expect(wrapInit.default.callCount).toEqual(1)
  expect(wrapMethod.default.callCount).toEqual(1)
  expect(wrapEventFilter.default.callCount).toEqual(1)
  expect(wrapDispose.default.callCount).toEqual(1)
  expect(validateEventFilter.default.callCount).toEqual(1)
  expect(importStream.default.callCount).toEqual(1)
  expect(exportStream.default.callCount).toEqual(1)
})
