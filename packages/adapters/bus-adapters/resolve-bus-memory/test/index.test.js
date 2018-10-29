import sinon from 'sinon'

test('resolve-bus-memory index', () => {
  const createAdapter = require('resolve-bus-base')

  const publish = require('../src/publish')
  const dispose = require('../src/dispose')

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

  expect(publish.default.callCount).toEqual(0)
  expect(dispose.default.callCount).toEqual(0)

  index.default()

  expect(publish.default.callCount).toEqual(1)
  expect(dispose.default.callCount).toEqual(1)

  const adapterCallArgs = createAdapter.default.firstCall.args
  expect(adapterCallArgs[2]).toEqual(publish.default)
  expect(adapterCallArgs[3]).toEqual(dispose.default)
})
