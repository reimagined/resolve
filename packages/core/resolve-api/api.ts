import url from 'url'
import { Context } from './context'
import { GenericError } from './errors'
import { doSubscribe, getSubscriptionKeys, doUnsubscribe } from './subscribe'
import { RequestOptions, request } from './request'
import { assertNonEmptyString } from './assertions'
import { getRootBasedUrl } from './utils'

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
export type CommandCallback = (error: Error | null, result: CommandResult | null) => void
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
type Query = ViewModelQuery | ReadModelQuery
const isReadModelQuery = (arg: any): arg is ReadModelQuery => arg && arg.resolver

type QueryResult = {
  timestamp: number
  data: any
}
type QueryOptions = {
  waitFor?: {
    validator: (result: any) => boolean
    period?: number
    attempts?: number
  }
}
type QueryCallback = (error: Error | null, result: QueryResult | null) => void

export const query = (
  context: Context,
  qr: Query,
  options?: QueryOptions | QueryCallback,
  callback?: QueryCallback
): PromiseOrVoid<QueryResult> => {
  const requestOptions: RequestOptions = {
    // TODO: add retry on temporary errors?
  }

  if (isOptions<QueryOptions>(options) && typeof options.waitFor?.validator === 'function') {
    const { validator, period = 1000, attempts = 5 } = options.waitFor

    requestOptions.waitForResponse = {
      validator: async (response): Promise<boolean> => validator(await response.json()),
      period,
      attempts
    }
  }

  const actualCallback = determineCallback<QueryCallback>(options, callback)

  let queryRequest

  if (isReadModelQuery(qr)) {
    const { name, resolver, args } = qr
    queryRequest = request(context, `/api/query/${name}/${resolver}`, args, requestOptions)
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
        data: await response.json()
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
export type SubscribeCallback = (error: Error | null, result: Subscription | null) => void

export type ResubscribeInfo = {
  eventTopic: string
  aggregateId: string
}
export type ResubscribeCallback = (error: Error | null, result: ResubscribeInfo | null) => void

export const subscribeTo = (
  context: Context,
  viewModelName: string,
  aggregateIds: AggregateSelector,
  handler: SubscribeHandler,
  subscribeCallback?: SubscribeCallback,
  resubscribeCallback?: ResubscribeCallback
): PromiseOrVoid<Subscription> => {
  const subscribeAsync = async (): Promise<Subscription> => {
    const subscriptionKeys = getSubscriptionKeys(context, viewModelName, aggregateIds)

    await Promise.all(
      subscriptionKeys.map(({ aggregateId, eventType }) =>
        doSubscribe(
          context,
          {
            topicName: eventType,
            topicId: aggregateId
          },
          handler,
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
    .then(result => subscribeCallback(null, result))
    .catch(error => subscribeCallback(error, null))

  return Promise.resolve({
    viewModelName,
    aggregateIds,
    handler
  })
}

export const unsubscribe = (context: Context, subscription: Subscription): Promise<any> => {
  const { viewModelName, aggregateIds, handler } = subscription

  const unsubscribeAsync = async (): Promise<any> => {
    const subscriptionKeys = getSubscriptionKeys(context, viewModelName, aggregateIds)
    console.debug(subscriptionKeys)

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
          handler
        )
      )
    )
  }

  return unsubscribeAsync()
}

const getStaticAssetUrl = ({ rootPath, staticPath }: Context, fileName: string): string => {
  assertNonEmptyString(fileName)

  return getRootBasedUrl(rootPath, url.resolve(`${staticPath}/`, `./${fileName}`))
}

export type API = {
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
  getStaticAssetUrl: (fileName: string) => string
  subscribeTo: (
    viewModelName: string,
    aggregateIds: AggregateSelector,
    handler: SubscribeHandler,
    subscribeCallback?: SubscribeCallback,
    resubscribeCallback?: ResubscribeCallback
  ) => PromiseOrVoid<Subscription>
  unsubscribe: (subscription: Subscription) => PromiseOrVoid<void>
}

export const getApi = (context: Context): API => ({
  command: (cmd, options?, callback?): PromiseOrVoid<CommandResult> =>
    command(context, cmd, options, callback),
  query: (qr, options, callback?): PromiseOrVoid<QueryResult> => query(context, qr, options, callback),
  getStaticAssetUrl: (fileName: string): string => getStaticAssetUrl(context, fileName),
  subscribeTo: (
    viewModelName,
    aggregateIds,
    handler,
    subscribeCallback?,
    resubscribeCallback?
  ): PromiseOrVoid<Subscription> =>
    subscribeTo(context, viewModelName, aggregateIds, handler, subscribeCallback, resubscribeCallback),
  unsubscribe: (subscription: Subscription): PromiseOrVoid<void> => unsubscribe(context, subscription)
})
