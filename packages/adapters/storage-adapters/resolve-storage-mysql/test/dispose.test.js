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
