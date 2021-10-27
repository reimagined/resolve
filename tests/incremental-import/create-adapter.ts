import fs from 'fs'
import path from 'path'

import type { Adapter } from '@resolve-js/eventstore-base'

// eslint-disable-next-line
import createEventStoreLiteAdapter from '@resolve-js/eventstore-lite'
// eslint-disable-next-line
import createEventStorePostgreSQLAdapter from '@resolve-js/eventstore-postgresql'
// eslint-disable-next-line
import createEventStoreMySQLAdapter from '@resolve-js/eventstore-mysql'

const createAdapter = () => {
  // return createEventStoreMySQLAdapter({
  //   host: '172.22.6.116',
  //   port: 3306,
  //   user: 'admin',
  //   password: 'admin',
  //   database: 'admin',
  //   eventsTableName: 'events' + Date.now(),
  //   snapshotsTableName: 'snapshots' + Date.now(),
  //   secretsTableName: 'secrets' + Date.now()
  // })

  // return createEventStorePostgreSQLAdapter({
  //   databaseName: 'public',
  //   eventsTableName: 'events' + Date.now(),
  //   snapshotsTableName: 'snapshots' + Date.now(),
  //   secretsTableName: 'secrets' + Date.now(),
  //   user: 'postgres',
  //   password: 'postgres',
  //   database: 'postgres',
  //   host: '172.22.6.116',
  //   port: 5432
  // })

  const tempName = Math.floor(Math.random() * 1000000)
  const databaseFile = path.join(__dirname, `${tempName}.events.txt`)

  const adapter = Object.create(
    createEventStoreLiteAdapter({
      databaseFile,
    }),
    {
      drop: {
        value: () => {
          try {
            fs.unlinkSync(databaseFile)
          } catch (error) {}
          try {
            fs.unlinkSync(`${databaseFile}-journal`)
          } catch (error) {}
        },
      },
    }
  )

  return adapter as Adapter
}

export default createAdapter
