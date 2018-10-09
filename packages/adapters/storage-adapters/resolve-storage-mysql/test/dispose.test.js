import sinon from 'sinon'

import dispose from '../src/dispose'

test('dispose should free resources by default', async () => {
  const pool = {
    connection: {
      execute: sinon.stub().callsFake(async () => null),
      end: sinon.stub().callsFake(async () => null)
    },
    escapeId: value => `@ESCAPED[${value}]`,
    tableName: 'tableName'
  }

  await dispose(pool, {})

  expect(pool.connection.execute.callCount).toEqual(0)

  expect(pool.connection.end.callCount).toEqual(1)
})

test('dispose should free resources and drop events with "dropEvents" option', async () => {
  const pool = {
    connection: {
      execute: sinon.stub().callsFake(async () => null),
      end: sinon.stub().callsFake(async () => null)
    },
    escapeId: value => `@ESCAPED[${value}]`,
    tableName: 'tableName'
  }

  await dispose(pool, { dropEvents: true })

  expect(pool.connection.execute.callCount).toEqual(1)
  expect(pool.connection.execute.firstCall.args).toMatchSnapshot()

  expect(pool.connection.end.callCount).toEqual(1)
})
