import { Context } from './context'
import { GenericError } from './errors'
import { doSubscribe, getSubscriptionKeys, doUnsubscribe } from './subscribe'
import {
  RequestOptions,
  request,
  NarrowedResponse,
  VALIDATED_RESULT
} from './request'
import { assertLeadingSlash, assertNonEmptyString } from './assertions'
import { getRootBasedUrl, isAbsoluteUrl } from './utils'

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
export type CommandCallback = (
  error: Error | null,
  result: CommandResult | null
) => void
export type CommandOptions = {}

export const command = (
  context: Context,
  cmd: Command,
  options?: CommandOptions | CommandCallback,
  callback?: CommandCallback
): PromiseOrVoid<CommandResult> => {
  const actualOptions = isOptions<CommandOptions>(options) ? options : undefined
  const actualCallback = determineCallback<CommandCallback>(options, callback)

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
    .then(result => {
      actualCallback(null, result)
      return result
    })
    .catch(error => {
      actualCallback(error, null)
      throw error
    })

  return undefined
}

type AggregateSelector = string[] | '*'
type ViewModelQuery = {
  name: string
  aggregateIds: AggregateSelector
  args: any
}
type ReadModelQuery = {
  name: string
  resolver: string
  args: object
}
export type Query = ViewModelQuery | ReadModelQuery
const isReadModelQuery = (arg: any): arg is ReadModelQuery =>
  arg && arg.resolver

export type QueryResult = {
  timestamp: number
  data: any
}
export type QueryOptions = {
  method?: 'GET' | 'POST'
  waitFor?: {
    validator: (result: any) => boolean
    period?: number
    attempts?: number
  }
}
export type QueryCallback = (
  error: Error | null,
  result: QueryResult | null
) => void

export const query = (
  context: Context,
  qr: Query,
  options?: QueryOptions | QueryCallback,
  callback?: QueryCallback
): PromiseOrVoid<QueryResult> => {
  const requestOptions: RequestOptions = {
    method: 'GET'
  }

  if (isOptions<QueryOptions>(options)) {
    if (typeof options.waitFor?.validator === 'function') {
      const { validator, period = 1000, attempts = 5 } = options.waitFor

      requestOptions.waitForResponse = {
        validator: async (response, confirm): Promise<void> => {
          const result = await response.json()
          if (validator(result)) {
            confirm(result)
          }
        },
        period,
        attempts
      }
    }
    requestOptions.method = options?.method ?? 'GET'
  }

  const actualCallback = determineCallback<QueryCallback>(options, callback)

  let queryRequest: Promise<NarrowedResponse>

  if (isReadModelQuery(qr)) {
    const { name, resolver, args } = qr
    queryRequest = request(
      context,
      `/api/query/${name}/${resolver}`,
      args,
      requestOptions
    )
  } else {
    const { name, aggregateIds, args } = qr
    const ids = aggregateIds === '*' ? aggregateIds : aggregateIds.join(',')
    queryRequest = request(
      context,
      `/api/query/${name}/${ids}`,
      {
        args
      },
      requestOptions
    )
  }

  const asyncExec = async (): Promise<QueryResult> => {
    const response = await queryRequest

    const responseDate = response.headers.get('Date')

    if (!responseDate) {
      throw new GenericError(`"Date" header missed within response`)
    }

    try {
      return {
        timestamp: Number(responseDate),
        data:
          VALIDATED_RESULT in response
            ? response[VALIDATED_RESULT]
            : await response.json()
      }
    } catch (error) {
      throw new GenericError(error)
    }
  }

  if (!actualCallback) {
    return asyncExec()
  }

  asyncExec()
    .then(result => {
      actualCallback(null, result)
      return result
    })
    .catch(error => {
      actualCallback(error, null)
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
export type SubscribeHandler = (event: unknown) => void
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
  viewModelName: string,
  aggregateIds: AggregateSelector,
  handler: SubscribeHandler,
  subscribeCallback?: SubscribeCallback,
  resubscribeCallback?: ResubscribeCallback
): PromiseOrVoid<Subscription> => {
  const subscribeAsync = async (): Promise<Subscription> => {
    const subscriptionKeys = getSubscriptionKeys(
      context,
      viewModelName,
      aggregateIds
    )

    await Promise.all(
      subscriptionKeys.map(({ aggregateId, eventType }) =>
        doSubscribe(
          context,
          {
            topicName: eventType,
            topicId: aggregateId
          },
          handler,
          viewModelName,
          resubscribeCallback
        )
      )
    )
    return {
      viewModelName,
      aggregateIds,
      handler
    }
  }

  if (typeof subscribeCallback !== 'function') {
    return subscribeAsync()
  }

  subscribeAsync()
    .then((result: Subscription) => subscribeCallback(null, result))
    .catch(error => subscribeCallback(error, null))

  return undefined
}

export const unsubscribe = (
  context: Context,
  subscription: Subscription
): Promise<any> => {
  const { viewModelName, aggregateIds, handler } = subscription

  const unsubscribeAsync = async (): Promise<any> => {
    const subscriptionKeys = getSubscriptionKeys(
      context,
      viewModelName,
      aggregateIds
    )

    if (typeof handler !== 'function') {
      return
    }

    await Promise.all(
      subscriptionKeys.map(({ aggregateId, eventType }) =>
        doUnsubscribe(
          context,
          {
            topicName: eventType,
            topicId: aggregateId
          },
          viewModelName,
          handler
        )
      )
    )
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

export type Client = {
  command: (
    command: Command,
    options?: CommandOptions | CommandCallback,
    callback?: CommandCallback
  ) => PromiseOrVoid<CommandResult>
  query: (
    query: Query,
    options?: QueryOptions | QueryCallback,
    callback?: QueryCallback
  ) => PromiseOrVoid<QueryResult>
  getStaticAssetUrl: (assetPath: string) => string
  subscribe: (
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
  subscribe: (
    viewModelName,
    aggregateIds,
    handler,
    subscribeCallback?,
    resubscribeCallback?
  ): PromiseOrVoid<Subscription> =>
    subscribe(
      context,
      viewModelName,
      aggregateIds,
      handler,
      subscribeCallback,
      resubscribeCallback
    ),
  unsubscribe: (subscription: Subscription): PromiseOrVoid<void> =>
    unsubscribe(context, subscription)
})
