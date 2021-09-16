import type { ResolveRequest, ResolveResponse } from '../../common/types'
import type { SavedEvent } from '@resolve-js/core'

export const queryIsReadyHandler = async (
  req: ResolveRequest,
  res: ResolveResponse
) => {
  try {
    const { eventstoreAdapter, eventSubscriber, eventListeners } = req.resolve
    const queryIsReadyPromises = []

    for (const [key, { eventTypes }] of eventListeners) {
      queryIsReadyPromises.push(
        (async () => {
          const latestEvent = await eventstoreAdapter.getLatestEvent({
            eventTypes,
          })
          if (latestEvent == null) {
            return
          }

          let successEvent: SavedEvent | null = null
          let failedEvent: SavedEvent | null = null
          while (failedEvent == null) {
            void ({ successEvent, failedEvent } = await eventSubscriber.status({
              eventSubscriber: key,
            }))
            if (
              successEvent != null &&
              successEvent.timestamp >= latestEvent.timestamp
            ) {
              break
            }

            await new Promise<void>((resolve) => setTimeout(resolve, 1000))
          }
        })()
      )
    }

    await Promise.all(queryIsReadyPromises)

    res.end('ok')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
    res.status(500)
    res.end(String(error))
  }
}
