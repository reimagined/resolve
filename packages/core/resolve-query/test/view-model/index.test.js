import sinon from 'sinon'

test('View-model index', () => {
  const createReadModel = require('../../src/view-model/create-view-model')

  const init = require('../../src/view-model/init')
  const getViewModel = require('../../src/view-model/get-view-model')
  const getLastError = require('../../src/view-model/get-last-error')
  const read = require('../../src/view-model/read')
  const readAndSerialize = require('../../src/view-model/read-and-serialize')
  const updateByEvents = require('../../src/view-model/update-by-events')
  const dispose = require('../../src/view-model/dispose')
  const eventHandler = require('../../src/view-model/event-handler')
  const getKey = require('../../src/view-model/get-key')

  sinon.stub(init, 'default').callsFake(() => () => {})
  sinon.stub(getViewModel, 'default').callsFake(() => () => {})
  sinon.stub(getLastError, 'default').callsFake(() => () => {})
  sinon.stub(read, 'default').callsFake(() => () => {})
  sinon.stub(readAndSerialize, 'default').callsFake(() => () => {})
  sinon.stub(updateByEvents, 'default').callsFake(() => () => {})
  sinon.stub(dispose, 'default').callsFake(() => () => {})
  sinon.stub(eventHandler, 'default').callsFake(() => () => {})
  sinon.stub(getKey, 'default').callsFake(() => () => {})

  sinon.stub(createReadModel, 'default').callsFake((...args) => {
    for (const func of args) {
      if (typeof func === 'function') {
        func('null')
      }
    }
  })

  const index = require('../../src/view-model/index.js')

  expect(init.default.callCount).toEqual(0)
  expect(getViewModel.default.callCount).toEqual(0)
  expect(getLastError.default.callCount).toEqual(0)
  expect(read.default.callCount).toEqual(0)
  expect(readAndSerialize.default.callCount).toEqual(0)
  expect(updateByEvents.default.callCount).toEqual(0)
  expect(dispose.default.callCount).toEqual(0)
  expect(eventHandler.default.callCount).toEqual(0)
  expect(getKey.default.callCount).toEqual(0)

  index.default()

  expect(init.default.callCount).toEqual(1)
  expect(getViewModel.default.callCount).toEqual(1)
  expect(getLastError.default.callCount).toEqual(1)
  expect(read.default.callCount).toEqual(1)
  expect(readAndSerialize.default.callCount).toEqual(1)
  expect(updateByEvents.default.callCount).toEqual(1)
  expect(dispose.default.callCount).toEqual(1)
  expect(eventHandler.default.callCount).toEqual(1)
  expect(getKey.default.callCount).toEqual(1)

  const viewModelCallArgs = createReadModel.default.firstCall.args

  expect(viewModelCallArgs[0]).toEqual(init.default)
  expect(viewModelCallArgs[1]).toEqual(getViewModel.default)
  expect(viewModelCallArgs[2]).toEqual(getLastError.default)
  expect(viewModelCallArgs[3]).toEqual(read.default)
  expect(viewModelCallArgs[4]).toEqual(readAndSerialize.default)
  expect(viewModelCallArgs[5]).toEqual(updateByEvents.default)
  expect(viewModelCallArgs[6]).toEqual(dispose.default)
  expect(viewModelCallArgs[7]).toEqual(eventHandler.default)
  expect(viewModelCallArgs[8]).toEqual(getKey.default)
})
