const parseEventSubscriberParameters = <
  T extends {
    eventSubscriber?: string | null | undefined
    modelName?: string | null | undefined
  }
>(
  params: T
): [string, Omit<T, 'eventSubscriber' | 'modelName'>] => {
  if (Object(params) !== params) {
    throw new TypeError(
      `Arguments of resolve-query method should be object, but got: ${JSON.stringify(
        params
      )}`
    )
  }

  const { eventSubscriber, modelName, ...parameters } = params
  let eventSubscriberName: string
  if (eventSubscriber == null) {
    if (modelName == null) {
      throw new Error(`Both "eventSubscriber" and "modelName" are null`)
    }
    eventSubscriberName = modelName
  } else {
    eventSubscriberName = eventSubscriber
  }

  return [eventSubscriberName, parameters]
}

export default parseEventSubscriberParameters
