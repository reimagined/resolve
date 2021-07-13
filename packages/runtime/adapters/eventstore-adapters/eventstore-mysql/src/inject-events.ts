import { AdapterPool } from './types'
import { SavedEvent } from '@resolve-js/eventstore-base'

const injectEvents = async function (
  pool: AdapterPool,
  events: SavedEvent[]
): Promise<void> {
  return
}

export default injectEvents
