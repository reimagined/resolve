import { Client } from 'pg'
import PgCursor from 'pg-cursor'
import { isPostgres } from '../readmodel-test-utils'

const maybeRunTest = isPostgres() ? describe : describe.skip

const config = {
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE,
  password: process.env.POSTGRES_PASSWORD,
  port: +process.env.POSTGRES_PORT,
}

function terminatingQuery(processID: number) {
  return `
        SELECT pg_terminate_backend(pid) FROM
        pg_stat_activity WHERE
        pid = ${processID}
        AND datname = '${process.env.POSTGRES_DATABASE}';`
}

// these tests are for tracking down the issue https://github.com/brianc/node-postgres/issues/2642
// and for finding possible solutions for erroneous behavior

maybeRunTest('testing node-postgres behavior', () => {
  test('pg cursor should throw error on reading attempt when connection is terminated', async () => {
    const client = new Client(config)
    client.on('error', function (err: Error) {
      //pass
    })

    const terminatingClient = new Client(config)

    let wasInCatch = false
    try {
      await client.connect()
      await terminatingClient.connect()

      const pgCursor = client.query(new PgCursor(`SELECT NOW()`))
      await terminatingClient.query(
        terminatingQuery(+(client as any).processID)
      )
      await pgCursor.read(1)
    } catch (err) {
      wasInCatch = true
      expect(err.message).toEqual(
        'terminating connection due to administrator command'
      )
    } finally {
      await client.end()
      await terminatingClient.end()
    }

    expect(wasInCatch).toBe(true)
  })

  test('pg cursor expects to hang on close when connection is terminated', async () => {
    const client = new Client(config)
    let wasInHandler = false
    client.on('error', function (err: Error) {
      wasInHandler = true
      expect(err.message).toEqual('Connection terminated unexpectedly')
    })

    const terminatingClient = new Client(config)

    try {
      await client.connect()
      await terminatingClient.connect()

      const pgCursor = client.query(new PgCursor(`SELECT NOW()`))
      await terminatingClient.query(
        terminatingQuery(+(client as any).processID)
      )
      const byTimeout = await Promise.race<boolean>([
        new Promise<boolean>((resolve) => {
          setTimeout(() => {
            resolve(true)
          }, 1000)
        }),
        pgCursor.close().then(() => false),
      ])
      expect(byTimeout).toBe(true)
    } catch (err) {
      expect('should not get in catch').toBe('')
    } finally {
      const byTimeout = await Promise.race<boolean>([
        new Promise<boolean>((resolve) => {
          setTimeout(() => {
            resolve(true)
          }, 1000)
        }),
        client.end().then(() => false),
      ])
      expect(byTimeout).toBe(true)
      await terminatingClient.end()
    }

    expect(wasInHandler).toBe(true)
  })

  test('pg cursor should not hang if not used when connection is terminated', async () => {
    const client = new Client(config)
    client.on('error', function (err: Error) {
      //pass
    })

    const terminatingClient = new Client(config)

    try {
      await client.connect()
      await terminatingClient.connect()

      const pgCursor = client.query(new PgCursor(`SELECT NOW()`))
      void pgCursor
      await terminatingClient.query(
        terminatingQuery(+(client as any).processID)
      )
    } catch (err) {
      expect('should not get in catch').toBe('')
    } finally {
      await client.end()
      await terminatingClient.end()
    }
    expect(true).toBe(true)
  })
})
