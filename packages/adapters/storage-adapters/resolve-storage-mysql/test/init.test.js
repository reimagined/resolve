import sinon from 'sinon'

import init from '../src/init'

test('init should connect to mysql database and prepare indexes', async () => {
  const connection = {
    execute: sinon.stub().callsFake(async () => null)
  }
  const mysql = {
    createConnection: sinon.stub().callsFake(async () => connection)
  }

  const escapeId = value => `@ESCAPED[${value}]`

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

  await init({ mysql, escapeId }, pool)

  expect(mysql.createConnection.callCount).toEqual(1)
  expect(mysql.createConnection.firstCall.args).toMatchSnapshot()

  expect(connection.execute.callCount).toEqual(1)
  expect(connection.execute.firstCall.args).toMatchSnapshot()

  expect(pool.tableName).toEqual(pool.config.tableName)
  expect(pool.escapeId).toEqual(escapeId)

  expect(pool.connection).toEqual(connection)
})
