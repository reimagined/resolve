import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import createEventStore from 'resolve-es'
import createStorage from 'resolve-storage-lite'
import { createDatabase, dropDatabase } from '../mysql-utils'

const execWorker = envs =>
  new Promise((resolve, reject) => {
    const childProcess = spawn('node', [path.join(__dirname, 'worker.js')], {
      env: envs,
      stdio: 'inherit'
    })

    childProcess.on('close', code => {
      if (String(code) !== String(0)) {
        reject(String(''))
        return
      }
      resolve()
    })

    childProcess.on('error', error => {
      reject(error)
    })
  })

describe('Read-model transactional read models', () => {
  it('should works correctly with mysql adapter', async () => {
    jest.setTimeout(300000)

    const storagePath = path.join(__dirname, 'event-storage.db')

    if (fs.existsSync(storagePath)) {
      fs.unlinkSync(storagePath)
    }

    const storage = createStorage({
      pathToFile: storagePath
    })

    const eventStore = createEventStore({ storage })

    const eventsCount = 5000

    for (let index = 0; index < eventsCount; index++) {
      await eventStore.saveEvent({
        aggregateId: `AGG-${index}`,
        aggregateVersion: 1,
        type: 'COUNT_EVENT',
        timestamp: index
      })
    }
    await eventStore.saveEvent({
      aggregateId: `AGG-${eventsCount}`,
      aggregateVersion: 1,
      type: 'FINISH_EVENT',
      timestamp: eventsCount
    })

    const databaseName = `TestTransactional${Math.floor(
      Math.random() * 1000000000000
    )}`

    const envs = {
      ADAPTER: 'mysql',
      MYSQL_USER: 'root',
      MYSQL_PASSWORD: 'root',
      MYSQL_DATABASE: databaseName,
      MYSQL_HOST: '127.0.0.1',
      MYSQL_PORT: '3306'
    }

    const connectionOptions = {
      user: envs.MYSQL_USER,
      password: envs.MYSQL_PASSWORD,
      database: 'mysql',
      host: envs.MYSQL_HOST,
      port: envs.MYSQL_PORT
    }

    await dropDatabase(connectionOptions, databaseName)
    await createDatabase(connectionOptions, databaseName)

    await Promise.all([
      execWorker(envs),
      execWorker(envs),
      execWorker(envs),
      execWorker(envs)
    ])

    await dropDatabase(connectionOptions, databaseName)
  })
})
