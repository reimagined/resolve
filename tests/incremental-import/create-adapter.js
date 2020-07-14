import createEventStoreLiteAdapter from 'resolve-eventstore-lite'
import createEventStorePostgreSQLAdapter from 'resolve-eventstore-postgresql'

const createAdapter = () => {
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
  return createEventStoreLiteAdapter({
    databaseFile: ':memory:',
    secretsFile: ':memory:'
  })
}

export default createAdapter
