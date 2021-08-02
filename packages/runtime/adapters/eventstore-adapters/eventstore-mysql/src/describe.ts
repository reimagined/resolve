import type { AdapterPool } from './types'
import type { EventStoreDescription } from '@resolve-js/eventstore-base'

const describe = async (pool: AdapterPool): Promise<EventStoreDescription> => {
  throw new Error('Describe is not implemented for this adapter')
}

export default describe
