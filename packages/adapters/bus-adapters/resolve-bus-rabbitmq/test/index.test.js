import sinon from 'sinon'

test('resolve-bus-rabbitmq index', () => {
  const createAdapter = require('resolve-bus-base')
  const onMessage = require('../src/on-message')
  const init = require('../src/init')
  const publish = require('../src/publish')
  const dispose = require('../src/dispose')

  sinon.stub(onMessage, 'default').callsFake(() => () => {})
  sinon.stub(init, 'default').callsFake(() => () => {})
  sinon.stub(publish, 'default').callsFake(() => () => {})
  sinon.stub(dispose, 'default').callsFake(() => () => {})

  sinon.stub(createAdapter, 'default').callsFake((...args) => {
    for (const func of args) {
      if (typeof func === 'function') {
        func()
      }
    }
  })

  const index = require('../src/index.js')

  expect(onMessage.default.callCount).toEqual(0)
  expect(init.default.callCount).toEqual(0)
  expect(publish.default.callCount).toEqual(0)
  expect(dispose.default.callCount).toEqual(0)

  index.default()

  expect(onMessage.default.callCount).toEqual(1)
  expect(init.default.callCount).toEqual(1)
  expect(publish.default.callCount).toEqual(1)
  expect(dispose.default.callCount).toEqual(1)

  const adapterCallArgs = createAdapter.default.firstCall.args
  expect(adapterCallArgs[0]).toEqual(onMessage.default)
  expect(adapterCallArgs[1]).toEqual(init.default)
  expect(adapterCallArgs[2]).toEqual(publish.default)
  expect(adapterCallArgs[3]).toEqual(dispose.default)
})
