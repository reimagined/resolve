import sinon from 'sinon'

test('View-model index', () => {
  const createViewModel = require('../src/create-view-model')

  const init = require('../src/init')
  const read = require('../src/read')
  const readAndSerialize = require('../src/read-and-serialize')
  const dispose = require('../src/dispose')
  const eventHandler = require('../src/event-handler')
  const getKey = require('../src/get-key')

  sinon.stub(init, 'default').callsFake(() => () => {})
  sinon.stub(read, 'default').callsFake(() => () => {})
  sinon.stub(readAndSerialize, 'default').callsFake(() => () => {})
  sinon.stub(dispose, 'default').callsFake(() => () => {})
  sinon.stub(eventHandler, 'default').callsFake(() => () => {})
  sinon.stub(getKey, 'default').callsFake(() => () => {})

  sinon.stub(createViewModel, 'default').callsFake((...args) => {
    for (const func of args) {
      if (typeof func === 'function') {
        func('null')
      }
    }
  })

  const index = require('../src/index.js')

  expect(init.default.callCount).toEqual(0)
  expect(read.default.callCount).toEqual(0)
  expect(readAndSerialize.default.callCount).toEqual(0)
  expect(dispose.default.callCount).toEqual(0)
  expect(eventHandler.default.callCount).toEqual(0)
  expect(getKey.default.callCount).toEqual(0)

  index.default()

  expect(init.default.callCount).toEqual(1)
  expect(read.default.callCount).toEqual(1)
  expect(readAndSerialize.default.callCount).toEqual(1)
  expect(dispose.default.callCount).toEqual(1)
  expect(eventHandler.default.callCount).toEqual(1)
  expect(getKey.default.callCount).toEqual(1)

  const viewModelCallArgs = createViewModel.default.firstCall.args

  expect(viewModelCallArgs[0]).toEqual(init.default)
  expect(viewModelCallArgs[1]).toEqual(read.default)
  expect(viewModelCallArgs[2]).toEqual(readAndSerialize.default)
  expect(viewModelCallArgs[3]).toEqual(dispose.default)
  expect(viewModelCallArgs[4]).toEqual(eventHandler.default)
  expect(viewModelCallArgs[5]).toEqual(getKey.default)
})
