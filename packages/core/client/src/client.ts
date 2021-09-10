import { StringifyOptions } from 'query-string'
import {
  IS_BUILT_IN,
  getRootBasedUrl,
  isAbsoluteUrl,
  assertLeadingSlash,
} from '@resolve-js/core'
import { Context } from './context'
import { GenericError } from './errors'
import { connect, disconnect } from './subscribe'
import {
  RequestOptions,
  request,
  NarrowedResponse,
  VALIDATED_RESULT,
} from './request'
import { assertNonEmptyString } from './assertions'
import determineOrigin from './determine-origin'
import { ViewModelDeserializer } from './types'
import { ClientMiddlewareOptions } from './middleware'

function determineCallback<T>(options: any, callback: any): T | null {
  if (typeof options === 'function') {
    return options
  }
  if (typeof callback === 'function') {
    return callback
  }
  return null
}
function isOptions<T>(arg: any): arg is T {
  return arg && typeof arg !== 'function'
}
type PromiseOrVoid<T> = void | Promise<T>

export type Command = {
  type: string
  aggregateId: string
  aggregateName: string
  payload?: object
  immediateConflict?: boolean
}
export type CommandResult = object
export type CommandCallback<T extends Command> = (
  error: Error | null,
  result: CommandResult | null,
  command: T
) => void
export type CommandOptions = {
  middleware?: ClientMiddlewareOptions
}
export const command = (
  context: Context,
  cmd: Command,
  options?: CommandOptions | CommandCallback<Command>,
  callback?: CommandCallback<Command>
): PromiseOrVoid<CommandResult> => {
  const actualOptions = isOptions<CommandOptions>(options) ? options : undefined
  const actualCallback = determineCallback<CommandCallback<Command>>(
    options,
    callback
  )

  const asyncExec = async (): Promise<CommandResult> => {
    const response = await request(context, '/api/commands', cmd, actualOptions)

    try {
      return await response.json()
    } catch (error) {
      throw new GenericError(error)
    }
  }

  if (!actualCallback) {
    return asyncExec()
  }

  asyncExec()
    .then((result) => {
      actualCallback(null, result, cmd)
    })
    .catch((error) => {
      actualCallback(error, null, cmd)
    })

  return undefined
}

type AggregateSelector = string[] | '*'
export type ViewModelQuery = {
  name: string
  aggregateIds: AggregateSelector
  args: any
}
export type ReadModelQuery = {
  name: string
  resolver: string
  args: object
}
export type Query = ViewModelQuery | ReadModelQuery
const isReadModelQuery = (arg: any): arg is ReadModelQuery =>
  arg && arg.resolver

export type QueryResult = {
  data: any
  meta?: {
    url?: string
    cursor?: string | null
    timestamp?: number
    aggregateIds?: string[]
    eventTypes?: string[]
  }
}
export type QueryOptions = {
  method?: 'GET' | 'POST'
  waitFor?: {
    validator: (result: any) => boolean
    period?: number
    attempts?: number
  }
  middleware?: ClientMiddlewareOptions
  queryStringOptions?: StringifyOptions
}
export type QueryCallback<T extends Query> = (
  error: Error | null,
  result: QueryResult | null,
  query: T
) => void

export const query = (
  context: Context,
  qr: Query,
  options?: QueryOptions | QueryCallback<Query>,
  callback?: QueryCallback<Query>
): PromiseOrVoid<QueryResult> => {
  const requestOptions: RequestOptions = {
    method: 'GET',
  }

  let viewModelDeserializer: ViewModelDeserializer | undefined
  if (!isReadModelQuery(qr)) {
    const viewModel = context.viewModels.find((model) => model.name === qr.name)
    if (viewModel && !viewModel.deserializeState[IS_BUILT_IN]) {
      viewModelDeserializer = viewModel.deserializeState
    }
  }

  if (isOptions<QueryOptions>(options)) {
    if (typeof options.waitFor?.validator === 'function') {
      const { validator, period = 1000, attempts = 5 } = options.waitFor

      requestOptions.waitForResponse = {
        validator: async (response, confirm): Promise<void> => {
          const result = await response.json()

          if (viewModelDeserializer != null && result != null && result.data) {
            result.data = viewModelDeserializer(result.data)
          }

          if (validator(result)) {
            confirm(result)
          }
        },
        period,
        attempts,
      }
    }
    requestOptions.method = options?.method ?? 'GET'
    requestOptions.middleware = options?.middleware
    requestOptions.queryStringOptions = options?.queryStringOptions
  }

  const actualCallback = determineCallback<QueryCallback<Query>>(
    options,
    callback
  )

  let queryRequest: Promise<NarrowedResponse>

  if (isReadModelQuery(qr)) {
    const { name, resolver, args } = qr
    queryRequest = request(
      context,
      `/api/query/${name}/${resolver}`,
      args,
      requestOptions,
      viewModelDeserializer
    )
  } else {
    const { name, aggregateIds, args } = qr
    const ids = aggregateIds === '*' ? aggregateIds : aggregateIds.join(',')
    queryRequest = request(
      context,
      `/api/query/${name}/${ids}`,
      {
        args,
        origin: determineOrigin(context.origin),
      },
      requestOptions,
      viewModelDeserializer
    )
  }

  const asyncExec = async (): Promise<QueryResult> => {
    const response = await queryRequest

    const responseDate = response.headers.get('Date')
    if (!responseDate) {
      throw new GenericError(`"Date" header missed within response`)
    }

    let subscriptionsUrl = null

    if (!isReadModelQuery(qr)) {
      const responseSubscription =
        response.headers.get('X-Resolve-View-Model-Subscription') ??
        '{ "url": "" }'
      const { url } = JSON.parse(responseSubscription)
      subscriptionsUrl = url
    }

    try {
      let result
      if (VALIDATED_RESULT in response) {
        result = response[VALIDATED_RESULT]
      } else {
        result = await response.json()
        if (viewModelDeserializer != null && result != null && result.data) {
          result.data = viewModelDeserializer(result.data)
        }
      }

      const meta = {
        ...result?.meta,
        timestamp: Number(responseDate),
      }

      if (subscriptionsUrl != null) {
        meta.url = subscriptionsUrl
      }

      return {
        ...result,
        meta,
      }
    } catch (error) {
      throw new GenericError(error)
    }
  }

  if (!actualCallback) {
    return asyncExec()
  }

  asyncExec()
    .then((result) => {
      actualCallback(null, result, qr)
      return result
    })
    .catch((error) => {
      actualCallback(error, null, qr)
      throw error
    })

  return undefined
}

export type Subscription = {
  readonly viewModelName: string
  readonly aggregateIds: AggregateSelector
  readonly handler: SubscribeHandler
}

export type SubscribeResult = void
export type SubscribeHandler = (event: any) => void
export type SubscribeCallback = (
  error: Error | null,
  result: Subscription | null
) => void

export type ResubscribeInfo = {
  eventTopic: string
  aggregateId: string
}
export type ResubscribeCallback = (
  error: Error | null,
  result: ResubscribeInfo | null
) => void

export const subscribe = (
  context: Context,
  url: string,
  cursor: string | null,
  viewModelName: string,
  aggregateIds: AggregateSelector,
  handler: SubscribeHandler,
  subscribeCallback?: SubscribeCallback,
  resubscribeCallback?: ResubscribeCallback
): PromiseOrVoid<Subscription> => {
  const subscribeAsync = async (): Promise<Subscription> => {
    await connect(
      context,
      url,
      cursor,
      aggregateIds,
      handler,
      viewModelName,
      resubscribeCallback
    )

    return {
      viewModelName,
      aggregateIds,
      handler,
    }
  }

  if (typeof subscribeCallback !== 'function') {
    return subscribeAsync()
  }

  subscribeAsync()
    .then((result: Subscription) => subscribeCallback(null, result))
    .catch((error) => subscribeCallback(error, null))

  return undefined
}

export const unsubscribe = (
  context: Context,
  subscription: Subscription
): Promise<any> => {
  const { viewModelName, aggregateIds, handler } = subscription

  const unsubscribeAsync = async (): Promise<any> => {
    if (typeof handler !== 'function') {
      return
    }

    await disconnect(context, aggregateIds, viewModelName, handler)
  }

  return unsubscribeAsync()
}

const getStaticAssetUrl = (
  { rootPath, staticPath, origin }: Context,
  assetPath: string
): string => {
  assertNonEmptyString(staticPath, 'staticPath')
  assertNonEmptyString(assetPath, 'assetPath')

  if (isAbsoluteUrl(assetPath)) {
    return assetPath
  }

  assertLeadingSlash(assetPath, 'assetPath')

  if (isAbsoluteUrl(staticPath)) {
    return `${staticPath}${assetPath}`
  }

  return getRootBasedUrl(rootPath, `/${staticPath}${assetPath}`, origin)
}

const getOriginPath = ({ rootPath, origin }: Context, path: string): string => {
  assertNonEmptyString(path, 'path')

  if (isAbsoluteUrl(path)) {
    return path
  }

  assertLeadingSlash(path, 'path')

  return getRootBasedUrl(rootPath, path, origin)
}

export type Client = {
  command: (
    command: Command,
    options?: CommandOptions | CommandCallback<Command>,
    callback?: CommandCallback<Command>
  ) => PromiseOrVoid<CommandResult>
  query: (
    query: Query,
    options?: QueryOptions | QueryCallback<Query>,
    callback?: QueryCallback<Query>
  ) => PromiseOrVoid<QueryResult>
  getStaticAssetUrl: (assetPath: string) => string
  getOriginPath: (path: string) => string
  subscribe: (
    url: string,
    cursor: string | null,
    viewModelName: string,
    aggregateIds: AggregateSelector,
    handler: SubscribeHandler,
    subscribeCallback?: SubscribeCallback,
    resubscribeCallback?: ResubscribeCallback
  ) => PromiseOrVoid<Subscription>
  unsubscribe: (subscription: Subscription) => PromiseOrVoid<void>
}

export const getClient = (context: Context): Client => ({
  command: (cmd, options?, callback?): PromiseOrVoid<CommandResult> =>
    command(context, cmd, options, callback),
  query: (qr, options, callback?): PromiseOrVoid<QueryResult> =>
    query(context, qr, options, callback),
  getStaticAssetUrl: (assetPath: string): string =>
    getStaticAssetUrl(context, assetPath),
  getOriginPath: (path: string): string => getOriginPath(context, path),
  subscribe: (
    url,
    cursor,
    viewModelName,
    aggregateIds,
    handler,
    subscribeCallback?,
    resubscribeCallback?
  ): PromiseOrVoid<Subscription> =>
    subscribe(
      context,
      url,
      cursor,
      viewModelName,
      aggregateIds,
      handler,
      subscribeCallback,
      resubscribeCallback
    ),
  unsubscribe: (subscription: Subscription): PromiseOrVoid<void> =>
    unsubscribe(context, subscription),
})
