import sinon from 'sinon'

test('resolve-readmodel-base index', () => {
  const createAdapter = require('../src/create-adapter')
  const wrapInit = require('../src/wrap-init')
  const wrapMethod = require('../src/wrap-method')
  const onMessage = require('../src/on-message')
  const init = require('../src/init')
  const publish = require('../src/publish')
  const subscribe = require('../src/subscribe')
  const dispose = require('../src/dispose')

  sinon.stub(wrapInit, 'default').callsFake(() => () => {})
  sinon.stub(wrapMethod, 'default').callsFake(() => () => {})
  sinon.stub(onMessage, 'default').callsFake(() => () => {})
  sinon.stub(init, 'default').callsFake(() => () => {})
  sinon.stub(publish, 'default').callsFake(() => () => {})
  sinon.stub(subscribe, 'default').callsFake(() => () => {})
  sinon.stub(dispose, 'default').callsFake(() => () => {})

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
  expect(onMessage.default.callCount).toEqual(0)
  expect(init.default.callCount).toEqual(0)
  expect(publish.default.callCount).toEqual(0)
  expect(subscribe.default.callCount).toEqual(0)
  expect(dispose.default.callCount).toEqual(0)

  index.default()

  expect(wrapInit.default.callCount).toEqual(1)
  expect(wrapMethod.default.callCount).toEqual(1)
  expect(onMessage.default.callCount).toEqual(1)
  expect(init.default.callCount).toEqual(1)
  expect(publish.default.callCount).toEqual(1)
  expect(subscribe.default.callCount).toEqual(1)
  expect(dispose.default.callCount).toEqual(1)

  const adapterCallArgs = createAdapter.default.firstCall.args
  expect(adapterCallArgs[0]).toEqual(wrapInit.default)
  expect(adapterCallArgs[1]).toEqual(wrapMethod.default)
  expect(adapterCallArgs[2]).toEqual(onMessage.default)
  expect(adapterCallArgs[3]).toEqual(init.default)
  expect(adapterCallArgs[4]).toEqual(publish.default)
  expect(adapterCallArgs[5]).toEqual(subscribe.default)
  expect(adapterCallArgs[6]).toEqual(dispose.default)
})
