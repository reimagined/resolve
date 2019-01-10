const path = require('path')

const createQuery = require('resolve-query').default
const createEventStore = require('resolve-es').default
const createStorage = require('resolve-storage-lite').default
const createMemoryAdapter = require('resolve-readmodel-memory').default
const createMySQLAdapter = require('resolve-readmodel-mysql').default
const createMongoDBAdapter = require('resolve-readmodel-mongo').default

const projection = require('./projection')
const resolvers = require('./resolvers')

void (async () => {
  try {
    let adapter
    switch (process.env.ADAPTER) {
      case 'memory':
        adapter = createMemoryAdapter({})
        break
      case 'mysql':
        adapter = createMySQLAdapter({
          user: process.env.MYSQL_USER,
          password: process.env.MYSQL_PASSWORD,
          database: process.env.MYSQL_DATABASE,
          host: process.env.MYSQL_HOST,
          port: process.env.MYSQL_PORT
        })
        break
      case 'mongo':
        adapter = createMongoDBAdapter({
          url: process.env.MONGO_URL
        })
        break
      default:
        throw new Error(
          `Incorrect process.env.ADAPTER = ${process.env.ADAPTER}`
        )
    }

    const storage = createStorage({
      pathToFile: path.join(__dirname, 'event-storage.db')
    })

    const eventStore = createEventStore({ storage })
    const adapterName = 'default-adapter'
    const readModelName = 'default-read-model'

    const query = createQuery({
      eventStore,
      viewModels: [],
      readModelAdapters: {
        [adapterName]: adapter
      },
      readModels: [
        {
          name: readModelName,
          adapterName,
          projection,
          resolvers
        }
      ]
    })

    await query.read({
      modelName: readModelName,
      resolverName: 'IS_FINISHED',
      resolverArgs: {}
    })

    do {
      const result = await query.read({
        modelName: readModelName,
        resolverName: 'IS_FINISHED',
        resolverArgs: {}
      })

      if (result) {
        break
      }
    } while (true)

    const result = await query.read({
      modelName: readModelName,
      resolverName: 'IS_SUCCESS',
      resolverArgs: {}
    })

    if (result !== 'ok') {
      throw new Error('IS_SUCCESS failed with', result)
    }

    process.exit(0)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err)
    process.exit(1)
  }
})()
