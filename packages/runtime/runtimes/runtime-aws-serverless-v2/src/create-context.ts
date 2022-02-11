import type { RuntimeEntryContext } from '@resolve-js/runtime-base'
import { getAccountIdFromLambdaContext } from 'resolve-cloud-common/utils'

import type { LambdaContext, RuntimeOptions } from './types'

const getEnvValue = (envName: string, key?: string): any => {
  const env = process.env[envName]
  if (env == null || (env?.constructor === String && env.trim() === '')) {
    throw new Error(`Environment variable ${envName} is required`)
  }

  if (key === undefined) {
    return env
  }

  const envValue = JSON.parse(env)

  if (key.indexOf('"') > -1) {
    throw new Error(`Incorrect property "${key}"`)
  }
  const jsonPath = key.split('.')
  let subValue = envValue
  for (const part of jsonPath) {
    subValue = subValue[part]

    if (subValue == null) {
      throw new Error(`Config property "${key}" is required`)
    }
  }

  return subValue
}

export class Context {
  readonly accountId: string
  readonly functionName: string
  readonly invokedFunctionArn: string
  readonly getRemainingTimeInMillis: () => number

  readonly assemblies: RuntimeEntryContext['assemblies']
  readonly constants: RuntimeEntryContext['constants']
  readonly domain: RuntimeEntryContext['domain']
  readonly resolveVersion: RuntimeEntryContext['resolveVersion']

  constructor(
    runtimeOptions: RuntimeOptions,
    runtimeEntryContext: RuntimeEntryContext,
    lambdaEvent: any,
    lambdaContext: LambdaContext
  ) {
    this.assemblies = runtimeEntryContext.assemblies
    this.constants = runtimeEntryContext.constants
    this.domain = runtimeEntryContext.domain
    this.resolveVersion = runtimeEntryContext.resolveVersion

    this.accountId = getAccountIdFromLambdaContext(lambdaContext)
    this.functionName = lambdaContext.functionName
    this.invokedFunctionArn = lambdaContext.invokedFunctionArn
    this.getRemainingTimeInMillis = lambdaContext.getRemainingTimeInMillis
  }

  get region(): string {
    return getEnvValue('AWS_REGION')
  }
  get deploymentId(): string {
    return getEnvValue('RESOLVE_DEPLOYMENT_ID')
  }
  get eventStoreId(): string {
    return getEnvValue('RESOLVE_EVENT_STORE_ID')
  }
  get eventStoreDatabaseName(): string {
    return getEnvValue('RESOLVE_EVENT_STORE_DATABASE_NAME')
  }
  get eventStoreClusterArn(): string {
    return getEnvValue('RESOLVE_EVENT_STORE_CLUSTER_ARN')
  }
  get eventStoreClusterEndpoint(): string {
    return getEnvValue('RESOLVE_EVENT_STORE_CLUSTER_HOST')
  }
  get eventStoreClusterPort(): number {
    return +getEnvValue('RESOLVE_EVENT_STORE_CLUSTER_PORT')
  }
  get readModelDatabaseName(): string {
    return getEnvValue('RESOLVE_READMODEL_DATABASE_NAME')
  }
  get readModelsClusterArn(): string {
    return getEnvValue('RESOLVE_READMODEL_CLUSTER_ARN')
  }
  get readModelsClusterEndpoint(): string {
    return getEnvValue('RESOLVE_EVENT_STORE_CLUSTER_HOST')
  }
  get readModelsClusterPort(): number {
    return +getEnvValue('RESOLVE_READMODEL_CLUSTER_PORT')
  }
  get userId(): string {
    return getEnvValue('RESOLVE_USER_ID')
  }
  get userPassword(): string {
    return getEnvValue('RESOLVE_USER_PASSWORD')
  }
  get userSecretArn(): string {
    return getEnvValue('RESOLVE_USER_SECRET_ARN')
  }
  get encryptedUserId(): string {
    return getEnvValue('RESOLVE_ENCRYPTED_USER_ID')
  }

  get websocketUrl(): string {
    return getEnvValue('RESOLVE_WS_URL')
  }
  get subscriptionTableName(): string {
    return getEnvValue('RESOLVE_SUBSCRIPTIONS_TABLE_NAME')
  }
  get uploaderLambdaArn(): string {
    return getEnvValue('RESOLVE_UPLOADER_LAMBDA_ARN')
  }
  get uploaderUrl(): string {
    return getEnvValue('RESOLVE_UPLOADER_URL')
  }
  get websocketLambdaArn(): string {
    return getEnvValue('RESOLVE_WEBSOCKET_LAMBDA_ARN')
  }
  get schedulerLambdaArn(): string {
    return getEnvValue('RESOLVE_SCHEDULER_LAMBDA_ARN')
  }
  get cloudStaticUrl(): string {
    return getEnvValue('RESOLVE_CLOUD_STATIC_URL')
  }
}

export function createContext(
  runtimeOptions: RuntimeOptions,
  runtimeEntryContext: RuntimeEntryContext,
  lambdaEvent: any,
  lambdaContext: LambdaContext
): Context {
  const context = new Context(
    runtimeOptions,
    runtimeEntryContext,
    lambdaEvent,
    lambdaContext
  )
  Object.preventExtensions(context)

  return context
}
