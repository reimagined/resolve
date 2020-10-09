import fs from 'fs'
import path from 'path'
// eslint-disable-next-line
import createEventStoreLiteAdapter from 'resolve-eventstore-lite'
// eslint-disable-next-line
import createEventStorePostgreSQLAdapter from 'resolve-eventstore-postgresql'
// eslint-disable-next-line
import createEventStorePostgreSQLServerlessAdapter from 'resolve-eventstore-postgresql-serverless'
// eslint-disable-next-line
import createEventStoreMySQLAdapter from 'resolve-eventstore-mysql'

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

  // return createEventStorePostgreSQLServerlessAdapter({
  //   databaseName: process.env.EVENT_STORE_DATABASE_NAME,
  //   dbClusterOrInstanceArn: process.env.EVENT_STORE_CLUSTER_ARN,
  //   awsSecretStoreArn: process.env.EVENT_STORE_SECRET_ARN,
  //   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  //   secretAccessKey: process.env.SECRET_ACCESS_KEY,
  //   eventsTableName: 'events' + Date.now(),
  //   snapshotsTableName: 'snapshots' + Date.now(),
  //   secretsTableName: 'secrets' + Date.now(),
  //   region: 'eu-west-1'
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
  const secretsFile = path.join(__dirname, `${tempName}.secrets.txt`)

  const adapter = Object.create(
    createEventStoreLiteAdapter({
      databaseFile,
      secretsFile,
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
          try {
            fs.unlinkSync(secretsFile)
          } catch (error) {}
          try {
            fs.unlinkSync(`${secretsFile}-journal`)
          } catch (error) {}
        },
      },
    }
  )

  return adapter
}

export default createAdapter
