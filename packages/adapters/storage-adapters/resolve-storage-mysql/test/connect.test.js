import sinon from 'sinon'

import connect from '../src/connect'

test('connect should connect to mysql database', async () => {
  const connection = {
    execute: sinon.stub().callsFake(async () => null)
  }
  const MySQL = {
    createConnection: sinon.stub().callsFake(async () => connection)
  }

  const escapeId = value => `@ESCAPED[${value}]`
  const escape = 'escape'

  const pool = {
    config: {
      host: 'host',
      port: 'port',
      user: 'user',
      password: 'password',
      database: 'database',
      tableName: 'tableName'
    }
  }

  await connect(
    pool,
    { MySQL, escapeId, escape }
  )

  expect(MySQL.createConnection.callCount).toEqual(1)
  expect(MySQL.createConnection.firstCall.args).toMatchSnapshot()

  expect(pool.tableName).toEqual(pool.config.tableName)
  expect(pool.escapeId).toEqual(escapeId)
  expect(pool.escape).toEqual(escape)
  expect(pool.connection).toEqual(connection)
})
