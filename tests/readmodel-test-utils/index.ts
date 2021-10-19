import createSqliteAdapter from '@resolve-js/readmodel-lite'
import createPostgresqlAdapter from '@resolve-js/readmodel-postgresql'
import createMySQLAdapter from '@resolve-js/readmodel-mysql'
import {
  create as createPostgresResource,
  destroy as destroyPostgresResource,
} from '@resolve-js/readmodel-postgresql'
import {
  create as createMySQLResource,
  destroy as destroyMySQLResource,
} from '@resolve-js/readmodel-mysql'

export function isPostgres(): boolean {
  if (
    process.env.TEST_POSTGRES !== undefined &&
    process.env.TEST_POSTGRES !== 'false'
  ) {
    if (process.env.POSTGRES_HOST == null) {
      throw new Error(`Environment variable POSTGRES_HOST is required`)
    }
    if (process.env.POSTGRES_PORT == null) {
      throw new Error(`Environment variable POSTGRES_PORT is required`)
    }
    if (process.env.POSTGRES_USER == null) {
      throw new Error(`Environment variable POSTGRES_USER is required`)
    }
    if (process.env.POSTGRES_PASSWORD == null) {
      throw new Error(`Environment variable POSTGRES_PASSWORD is required`)
    }
    if (process.env.POSTGRES_DATABASE == null) {
      throw new Error(`Environment variable POSTGRES_DATABASE is required`)
    }
    return true
  }
}

export function isMySQL(): boolean {
  if (
    process.env.TEST_MYSQL !== undefined &&
    process.env.TEST_MYSQL !== 'false'
  ) {
    if (process.env.MYSQL_HOST == null) {
      throw new Error(`Environment variable MYSQL_HOST is required`)
    }
    if (process.env.MYSQL_PORT == null) {
      throw new Error(`Environment variable MYSQL_PORT is required`)
    }
    if (process.env.MYSQL_USER == null) {
      throw new Error(`Environment variable MYSQL_USER is required`)
    }
    if (process.env.MYSQL_PASSWORD == null) {
      throw new Error(`Environment variable MYSQL_PASSWORD is required`)
    }
    return true
  }
}

export function jestTimeout(): number {
  if (
    process.env.TEST_POSTGRES_SERVERLESS !== undefined &&
    process.env.TEST_POSTGRES_SERVERLESS !== 'false'
  ) {
    return 1000 * 60 * 5
  } else {
    return 1000 * 60 * 1
  }
}

let adapters: Record<string, any> = {}

const proxy = new Proxy(
  {},
  {
    get(_: any, adapterName: string): any {
      return new Proxy(
        {},
        {
          get(_: any, key: string): any {
            if (key === 'bind' || key === 'apply' || key === 'call') {
              return adapters[adapterName][key].bind(adapters[adapterName])
            } else {
              return adapters[adapterName][key]
            }
          },
          set() {
            throw new TypeError()
          },
        }
      )
    },
    set() {
      throw new TypeError()
    },
  }
)

export { proxy as adapters }

export function getPostgresOptions(uniqueName: string) {
  return {
    databaseName: uniqueName,
    userLogin: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DATABASE,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    port: +process.env.POSTGRES_PORT,
    host: process.env.POSTGRES_HOST,
  }
}

export function getMySQLOptions(uniqueName: string) {
  return {
    database: uniqueName,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    port: +process.env.MYSQL_PORT,
    host: process.env.MYSQL_HOST,
  }
}

export const adapterFactory = isPostgres()
  ? {
      name: '@resolve-js/readmodel-postgresql',
      create(uniqueName: string) {
        return async () => {
          const options = getPostgresOptions(uniqueName)

          try {
            await destroyPostgresResource(options)
          } catch (e) {}
          await createPostgresResource(options)

          adapters[uniqueName] = createPostgresqlAdapter(options)
        }
      },
      destroy(uniqueName: string) {
        return async () => {
          const options = getPostgresOptions(uniqueName)

          await adapters[uniqueName].dispose()

          delete adapters[uniqueName]

          await destroyPostgresResource(options)
        }
      },
    }
  : isMySQL()
  ? {
      name: '@resolve-js/readmodel-postgresql',
      create(uniqueName: string) {
        return async () => {
          const options = getMySQLOptions(uniqueName)

          try {
            await destroyMySQLResource(options)
          } catch (e) {}
          await createMySQLResource(options)

          adapters[uniqueName] = createMySQLAdapter(options)
        }
      },
      destroy(uniqueName: string) {
        return async () => {
          const options = getMySQLOptions(uniqueName)

          await adapters[uniqueName].dispose()

          delete adapters[uniqueName]

          await destroyMySQLResource(options)
        }
      },
    }
  : {
      name: '@resolve-js/readmodel-lite',
      create(uniqueName: string) {
        return async () => {
          adapters[uniqueName] = createSqliteAdapter({
            databaseFile: ':memory:',
          })
        }
      },
      destroy(uniqueName: string) {
        return async () => {
          await adapters[uniqueName].dispose()

          delete adapters[uniqueName]
        }
      },
    }

export default adapterFactory
