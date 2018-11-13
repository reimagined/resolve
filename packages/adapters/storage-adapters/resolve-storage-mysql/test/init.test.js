import sinon from 'sinon'

import init from '../src/init'

test('init should connect to mysql database and prepare indexes', async () => {
  const connection = {
    execute: sinon.stub().callsFake(async () => null)
  }

  const escapeId = value => `@ESCAPED[${value}]`

  const pool = {
    tableName: 'tableName',
    connection,
    escapeId
  }

  await init(pool)

  expect(connection.execute.callCount).toEqual(1)
  expect(connection.execute.firstCall.args).toMatchSnapshot()
})
