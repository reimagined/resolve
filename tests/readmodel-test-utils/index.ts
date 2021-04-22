import * as AWS from 'aws-sdk'
import createSqliteAdapter from '@resolve-js/readmodel-lite'
import createPostgresqlServerlessAdapter from '@resolve-js/readmodel-postgresql-serverless'
import {
  create as createResource,
  destroy as destroyResource,
} from '@resolve-js/readmodel-postgresql-serverless'

export function isPostgresServerless(): boolean {
  if (
    process.env.TEST_POSTGRES_SERVERLESS !== undefined &&
    process.env.TEST_POSTGRES_SERVERLESS !== 'false'
  ) {
    if (process.env.AWS_ACCESS_KEY_ID == null) {
      throw new Error(`Environment variable AWS_ACCESS_KEY_ID is required`)
    }
    if (process.env.AWS_SECRET_ACCESS_KEY == null) {
      throw new Error(`Environment variable AWS_SECRET_ACCESS_KEY is required`)
    }
    if (process.env.AWS_RDS_CLUSTER_ARN == null) {
      throw new Error(`Environment variable AWS_RDS_CLUSTER_ARN is required`)
    }
    if (process.env.AWS_RDS_ADMIN_SECRET_ARN == null) {
      throw new Error(
        `Environment variable AWS_RDS_ADMIN_SECRET_ARN is required`
      )
    }
    AWS.config.update({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    })
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

export function getPostgresServerlessOptions(uniqueName: string) {
  return {
    databaseName: uniqueName,
    dbClusterOrInstanceArn: process.env.AWS_RDS_CLUSTER_ARN,
    awsSecretStoreAdminArn: process.env.AWS_RDS_ADMIN_SECRET_ARN,
    region: process.env.AWS_REGION ?? 'eu-central-1',
    userLogin: process.env.AWS_RDS_USERNAME ?? 'master',
  }
}

export const adapterFactory = isPostgresServerless()
  ? {
      name: '@resolve-js/readmodel-postgresql-serverless',
      create(uniqueName: string) {
        return async () => {
          const options = getPostgresServerlessOptions(uniqueName)

          try {
            await destroyResource(options)
          } catch {}
          await createResource(options)

          adapters[uniqueName] = createPostgresqlServerlessAdapter({
            databaseName: options.databaseName,
            dbClusterOrInstanceArn: options.dbClusterOrInstanceArn,
            awsSecretStoreArn: options.awsSecretStoreAdminArn,
            region: options.region,
          })
        }
      },
      destroy(uniqueName: string) {
        return async () => {
          const options = getPostgresServerlessOptions(uniqueName)

          await adapters[uniqueName].dispose()

          await destroyResource(options)

          delete adapters[uniqueName]
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
