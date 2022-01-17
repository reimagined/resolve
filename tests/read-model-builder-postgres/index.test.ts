import {
  default as factory,
  isPostgres,
  adapters,
} from '../readmodel-test-utils'
type UnPromise<T> = T extends Promise<T> ? T : never
const maybeDescribe = isPostgres() ? describe : describe.skip
jest.setTimeout(60000)

maybeDescribe('Postgres reconnections with delay', () => {
  const uniqueName = 'postgres-reconnections-delay' as const
  const readModelName = 'PostgresReconnectionsDelay' as const
  const getDelay = (delay: number | null) => (delay != null ? +delay : 0)
  const delayFunction = async (delay: number) =>
    await new Promise((resolve) => setTimeout(resolve, getDelay(delay)))
  const eventType = 'EVENT_TYPE'
  const getNotificationObj = (
    isNext: boolean,
    notificationExtraPayload?: object
  ) => ({
    eventSubscriber: readModelName,
    initiator: isNext ? 'read-model-next' : 'command',
    notificationId: `NT-${Date.now()}${Math.floor(Math.random() * 1000000)}`,
    sendTime: Date.now(),
    ...(notificationExtraPayload != null ? notificationExtraPayload : {}),
  })
  const subscriptionOptions = { eventTypes: [eventType], aggregateIds: null }
  const currentConnections = new Set()
  const currentBuilders = new Set()
  let adapter: typeof adapters[typeof uniqueName]
  let baseConnection: UnPromise<ReturnType<typeof adapter['connect']>>
  const connectionsDelays = new WeakMap<typeof baseConnection, Array<number>>()
  let flushWorkers: Function
  let buildOnConnection: Function
  let performWorkers = true

  beforeAll(async () => {
    await factory.create(uniqueName)()
    adapter = adapters[uniqueName]
    baseConnection = await adapter.connect(readModelName)
    flushWorkers = async () =>
      await adapter.subscribe(
        baseConnection,
        readModelName,
        subscriptionOptions.eventTypes,
        subscriptionOptions.aggregateIds,
        async () => null
      )
    const baseSubscribe = flushWorkers
    await baseSubscribe()
    buildOnConnection = async (
      connection: typeof baseConnection,
      parameters: any
    ) => {
      if (!performWorkers) {
        return
      }
      let buildPromise
      try {
        buildPromise = adapter.build(
          connection,
          readModelName,
          connection,
          {
            acquireInitHandler: async () => delayFunction.bind(null, 100),
            acquireEventHandler: async () => delayFunction.bind(null, 5000),
            acquireResolver: async () => delayFunction.bind(null, 100),
            connectorName: 'default',
            name: readModelName,
          },
          (timeout: number, notificationExtraPayload: object) => {
            void (async () => {
              if (!connectionsDelays.has(connection)) {
                connectionsDelays.set(connection, [])
              }
              connectionsDelays.get(connection).push(getDelay(timeout))
              await buildPromise
              await delayFunction(timeout)
              await buildOnConnection(
                connection,
                getNotificationObj(true, notificationExtraPayload)
              )
            })()
            return Promise.resolve(null)
          },
          {
            loadEvents: async ({ cursor }) => ({
              events: cursor === 'true' ? [{ type: eventType }] : [],
            }),
            getNextCursor: (cursor) => (cursor == null ? 'true' : 'false'),
            establishTimeLimit: delayFunction,
          },
          getDelay.bind(null, 60000),
          parameters
        )
        currentBuilders.add(buildPromise)
        await buildPromise
      } finally {
        if (buildPromise != null) {
          currentBuilders.delete(buildPromise)
        }
      }
    }
  })

  afterAll(async () => {
    await Promise.all(
      Array.from(currentConnections).map(async (connection) => {
        try {
          await adapter.disconnect(connection, readModelName)
        } catch (e) {}
      })
    )
    currentConnections.clear()

    await adapter.unsubscribe(baseConnection, readModelName, async () => null)
    await adapter.disconnect(baseConnection, readModelName)

    await factory.destroy(uniqueName)()
  })

  test('should perform with correct jitter', async () => {
    while (currentConnections.size < 3) {
      currentConnections.add(await adapter.connect(readModelName))
    }
    for (const connection of currentConnections) {
      void buildOnConnection(connection, getNotificationObj(false))
    }

    const stopThrottlingTimestamp = Date.now() + 10000
    while (Date.now() < stopThrottlingTimestamp) {
      await flushWorkers()
      await delayFunction(100)
    }

    while (currentBuilders.size > 0) {
      await delayFunction(500)
    }
    performWorkers = false

    for (const connection of currentConnections) {
      const delays = connectionsDelays.get(connection) ?? []
      const delaysBase2Degrees = delays
        .filter((delay) => delay > 0)
        .map((delay) => Math.log2(delay / 100))

      for (let index = 0; index < delaysBase2Degrees.length; index++) {
        expect(Math.floor(delaysBase2Degrees[index])).toEqual(
          delaysBase2Degrees[index]
        )
        expect(
          delaysBase2Degrees[index] === 0 ||
            (index > 0
              ? delaysBase2Degrees[index - 1] + 1 === delaysBase2Degrees[index]
              : false)
        ).toEqual(true)
      }
      await adapter.disconnect(connection, readModelName)
    }
    currentConnections.clear()
  })
})
