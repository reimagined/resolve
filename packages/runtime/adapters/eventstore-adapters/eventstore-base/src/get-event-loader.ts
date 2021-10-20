import type {
  EventLoaderFilter,
  AdapterPoolConnectedProps,
  AdapterPoolConnected,
  StoredEventBatchPointer,
  EventLoader,
  EventLoaderOptions,
} from './types'

const getEventLoader = async <ConnectedProps extends AdapterPoolConnectedProps>(
  pool: AdapterPoolConnected<ConnectedProps>,
  filter: EventLoaderFilter,
  options?: EventLoaderOptions
): Promise<EventLoader> => {
  if (
    pool.getEventLoaderNative !== undefined &&
    (options === undefined || !options.preferRegular)
  ) {
    return await pool.getEventLoaderNative(filter)
  }

  const detail = {
    cursor: filter.cursor,
  }

  return {
    async close() {
      return
    },
    async loadEvents(limit: number): Promise<StoredEventBatchPointer> {
      const result = await pool.loadEventsByCursor({
        ...filter,
        cursor: detail.cursor,
        limit,
      })
      detail.cursor = result.cursor
      return result
    },
    get cursor() {
      return detail.cursor
    },
    isNative: false,
  }
}

export default getEventLoader
