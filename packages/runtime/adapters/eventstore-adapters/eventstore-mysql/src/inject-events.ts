import { AdapterPool } from './types'
import { StoredEvent } from '@resolve-js/eventstore-base'

const injectEvents = async function (
  pool: AdapterPool,
  events: StoredEvent[]
): Promise<void> {
  return
}

export default injectEvents
