import {
  subscribeAdapterNotInitialized,
  subscribeAdapterAlreadyInitialized,
} from './subscribe-adapter-constants'

export interface SubscribeAdapter {
  init: () => Promise<any>
  close: () => Promise<any>
  isConnected: () => boolean
}

export interface CreateSubscribeAdapter {
  (options: {
    url: string
    cursor: string
    onEvent: Function
  }): SubscribeAdapter
  adapterName: string
}

const createClientAdapter: CreateSubscribeAdapter = ({
  url,
  cursor,
  onEvent,
}) => {
  let client: WebSocket | undefined
  let isInitialized: boolean
  let currentCursor: string | undefined

  return {
    async init(): Promise<void> {
      if (isInitialized) {
        throw new Error(subscribeAdapterAlreadyInitialized)
      }

      return await new Promise((resolve, reject) => {
        client = new WebSocket(url)

        client.onopen = (): void => {
          isInitialized = true
          resolve()

          client?.send(
            JSON.stringify({
              type: 'pullEvents',
              cursor,
            })
          )
        }

        client.onmessage = (message): void => {
          try {
            const data = JSON.parse(message.data)

            switch (data.type) {
              case 'event': {
                client?.send(
                  JSON.stringify({
                    type: 'pullEvents',
                    cursor: currentCursor,
                  })
                )
                break
              }
              case 'pullEvents': {
                data.payload.events.forEach((event: any) => {
                  onEvent(event)
                })
                currentCursor = data.payload.cursor
                break
              }
              default: {
                // eslint-disable-next-line no-console
                console.warn(`Unknown '${data.type}' socket message type`)
              }
            }
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('WebSocket message error', error)
          }
        }
      })
    },

    async close(): Promise<void> {
      if (!isInitialized || client == null) {
        throw new Error(subscribeAdapterNotInitialized)
      }
      isInitialized = false
      client.close()

      client = undefined
    },

    isConnected(): boolean {
      if (!isInitialized || client == null) {
        return false
      }

      return client.readyState === 1
    },
  }
}

createClientAdapter.adapterName = 'ws'

export default createClientAdapter
