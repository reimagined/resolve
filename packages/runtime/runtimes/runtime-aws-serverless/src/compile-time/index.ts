import { declareRuntimeEnv } from '@resolve-js/core'

import { getLog } from './get-log'

// TODO
type ResolveConfig = any

const warningAboutValue = (valueName: string) =>
  `The ${valueName} config parameter ignored. This parameter is not customizable for AWS serverless runtime.`

const messageAboutDefaultValue = (valueName: string) =>
  `Setting default ${valueName} for aws serverless runtime`

export const adjustResolveConfig = async (resolveConfig: ResolveConfig) => {
  const log = getLog('adjust-resolve-config')

  resolveConfig.target = 'cloud'
  resolveConfig.externalDependencies = [
    '@resolve-js/eventstore-postgresql',
    '@resolve-js/readmodel-postgresql',
  ]

  if (resolveConfig.eventstoreAdapter != null) {
    log.warn(warningAboutValue('eventstoreAdapter'))
  }
  log.debug(messageAboutDefaultValue('eventstoreAdapter'))
  resolveConfig.eventstoreAdapter = {
    module: '@resolve-js/eventstore-postgresql',
    options: {
      databaseName: declareRuntimeEnv('RESOLVE_EVENT_STORE_DATABASE_NAME'),
      host: declareRuntimeEnv('RESOLVE_EVENT_STORE_CLUSTER_HOST'),
      port: declareRuntimeEnv('RESOLVE_EVENT_STORE_CLUSTER_PORT'),
      user: declareRuntimeEnv('RESOLVE_USER_ID'),
      password: declareRuntimeEnv('RESOLVE_USER_PASSWORD'),
      database: 'postgres',
    },
  }

  if (resolveConfig.staticPath !== 'static') {
    log.warn(warningAboutValue('staticPath'))
  }
  messageAboutDefaultValue('staticPath')
  resolveConfig.staticPath = declareRuntimeEnv('RESOLVE_CLOUD_STATIC_URL')

  if (
    resolveConfig.readModelConnectors &&
    resolveConfig.readModelConnectors.default != null
  ) {
    log.warn(warningAboutValue('readModelConnectors.default'))
  }

  if (resolveConfig.readModelConnectors == null) {
    resolveConfig.readModelConnectors = {}
  }

  log.debug(messageAboutDefaultValue('readModelConnectors.default'))
  resolveConfig.readModelConnectors.default = {
    module: '@resolve-js/readmodel-postgresql',
    options: {
      databaseName: declareRuntimeEnv('RESOLVE_READMODEL_DATABASE_NAME'),
      host: declareRuntimeEnv('RESOLVE_READMODEL_CLUSTER_HOST'),
      port: declareRuntimeEnv('RESOLVE_READMODEL_CLUSTER_PORT'),
      user: declareRuntimeEnv('RESOLVE_USER_ID'),
      password: declareRuntimeEnv('RESOLVE_USER_PASSWORD'),
      database: 'postgres',
    },
  }
}
