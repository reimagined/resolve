import sinon from 'sinon'

test('Read-model index', () => {
  const createReadModel = require('../../src/read-model/create-read-model')

  const connect = require('../../src/read-model/connect')
  const loadEvents = require('../../src/read-model/load-events')
  const getLastError = require('../../src/read-model/get-last-error')
  const read = require('../../src/read-model/read')
  const readAndSerialize = require('../../src/read-model/read-and-serialize')
  const updateByEvents = require('../../src/read-model/update-by-events')
  const resolverNames = require('../../src/read-model/resolver-names')
  const dispose = require('../../src/read-model/dispose')
  const projectionInvoker = require('../../src/read-model/projection-invoker')
  const waitEventCausalConsistency = require('../../src/read-model/wait-event-causal-consistency')

  sinon.stub(connect, 'default').callsFake(() => () => {})
  sinon.stub(loadEvents, 'default').callsFake(() => () => {})
  sinon.stub(getLastError, 'default').callsFake(() => () => {})
  sinon.stub(read, 'default').callsFake(() => () => {})
  sinon.stub(readAndSerialize, 'default').callsFake(() => () => {})
  sinon.stub(updateByEvents, 'default').callsFake(() => () => {})
  sinon.stub(resolverNames, 'default').callsFake(() => () => {})
  sinon.stub(dispose, 'default').callsFake(() => () => {})
  sinon.stub(projectionInvoker, 'default').callsFake(() => () => {})
  sinon.stub(waitEventCausalConsistency, 'default').callsFake(() => () => {})

  sinon.stub(createReadModel, 'default').callsFake((...args) => {
    for (const func of args) {
      if (typeof func === 'function') {
        func('null')
      }
    }
  })

  const index = require('../../src/read-model/index.js')

  expect(connect.default.callCount).toEqual(0)
  expect(loadEvents.default.callCount).toEqual(0)
  expect(getLastError.default.callCount).toEqual(0)
  expect(read.default.callCount).toEqual(0)
  expect(readAndSerialize.default.callCount).toEqual(0)
  expect(updateByEvents.default.callCount).toEqual(0)
  expect(resolverNames.default.callCount).toEqual(0)
  expect(dispose.default.callCount).toEqual(0)
  expect(projectionInvoker.default.callCount).toEqual(0)
  expect(waitEventCausalConsistency.default.callCount).toEqual(0)

  index.default()

  expect(connect.default.callCount).toEqual(1)
  expect(loadEvents.default.callCount).toEqual(1)
  expect(getLastError.default.callCount).toEqual(1)
  expect(read.default.callCount).toEqual(1)
  expect(readAndSerialize.default.callCount).toEqual(1)
  expect(updateByEvents.default.callCount).toEqual(1)
  expect(resolverNames.default.callCount).toEqual(1)
  expect(dispose.default.callCount).toEqual(1)
  expect(projectionInvoker.default.callCount).toEqual(1)
  expect(waitEventCausalConsistency.default.callCount).toEqual(1)

  const readModelCallArgs = createReadModel.default.firstCall.args

  expect(readModelCallArgs[0]).toEqual(connect.default)
  expect(readModelCallArgs[1]).toEqual(loadEvents.default)
  expect(readModelCallArgs[2]).toEqual(getLastError.default)
  expect(readModelCallArgs[3]).toEqual(read.default)
  expect(readModelCallArgs[4]).toEqual(readAndSerialize.default)
  expect(readModelCallArgs[5]).toEqual(updateByEvents.default)
  expect(readModelCallArgs[6]).toEqual(resolverNames.default)
  expect(readModelCallArgs[7]).toEqual(dispose.default)
  expect(readModelCallArgs[8]).toEqual(projectionInvoker.default)
  expect(readModelCallArgs[9]).toEqual(waitEventCausalConsistency.default)
})
