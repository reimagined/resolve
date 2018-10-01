import sinon from 'sinon'

test('resolve-readmodel-base index', () => {
  const buildProjection = require('../src/build-projection')
  const checkStoreApi = require('../src/check-store-api')
  const createAdapter = require('../src/create-adapter')
  const checkTableSchema = require('../src/check-table-schema')
  const wrapApis = require('../src/wrap-apis')
  const init = require('../src/init')
  const reset = require('../src/reset')

  buildProjection.default = sinon.stub().callsFake(() => () => {})
  checkStoreApi.default = sinon.stub().callsFake(() => () => {})
  checkTableSchema.default = sinon.stub().callsFake(() => () => {})
  wrapApis.default = sinon.stub().callsFake(() => () => {})
  init.default = sinon.stub().callsFake(() => () => {})
  reset.default = sinon.stub().callsFake(() => () => {})

  createAdapter.default = sinon.stub().callsFake((...args) => {
    args.forEach(func => func())
  })

  const index = require('../src/index.js')

  expect(buildProjection.default.callCount).toEqual(0)
  expect(checkStoreApi.default.callCount).toEqual(0)
  expect(checkTableSchema.default.callCount).toEqual(0)
  expect(wrapApis.default.callCount).toEqual(0)
  expect(init.default.callCount).toEqual(0)
  expect(reset.default.callCount).toEqual(0)

  index.default()

  expect(buildProjection.default.callCount).toEqual(1)
  expect(checkStoreApi.default.callCount).toEqual(1)
  expect(checkTableSchema.default.callCount).toEqual(1)
  expect(wrapApis.default.callCount).toEqual(1)
  expect(init.default.callCount).toEqual(1)
  expect(reset.default.callCount).toEqual(1)

  const adapterCallArgs = createAdapter.default.firstCall.args
  expect(adapterCallArgs[0]).toEqual(buildProjection.default)
  expect(adapterCallArgs[1]).toEqual(checkStoreApi.default)
  expect(adapterCallArgs[2]).toEqual(checkTableSchema.default)
  expect(adapterCallArgs[3]).toEqual(wrapApis.default)
  expect(adapterCallArgs[4]).toEqual(init.default)
  expect(adapterCallArgs[5]).toEqual(reset.default)
})
